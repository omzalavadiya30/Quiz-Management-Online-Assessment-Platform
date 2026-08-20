import express from "express";
import supabase from "../../config/supabase.js";
import { verifyToken, requireStudent } from "../../middleware/auth.js";

const router = express.Router();
const attempts = new Map();
const publicQuizSelect = "id,title,description,category_id,difficulty,duration,passing_score,max_attempts,status,created_at,categories(name)";
const questionSelect = "id,quiz_id,question_text,explanation,marks,difficulty,options(id,option_text,is_correct)";

export function dashboardForStudent(studentId) {
  const completedAttempts = Array.from(attempts.values())
    .filter((attempt) => attempt.studentId === studentId && attempt.result)
    .sort((first, second) => Date.parse(second.result.submitted_at) - Date.parse(first.result.submitted_at));
  const scores = completedAttempts.map((attempt) => attempt.result.percentage);
  const totalQuestionsAnswered = completedAttempts.reduce((total, attempt) => total + attempt.result.review.filter((item) => item.selected_answer).length, 0);

  return {
    stats: {
      totalQuizzesAttempted: completedAttempts.length,
      totalQuizzesPassed: completedAttempts.filter((attempt) => attempt.result.status === "PASSED").length,
      totalQuizzesFailed: completedAttempts.filter((attempt) => attempt.result.status === "FAILED").length,
      averageScore: scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0,
      highestScore: scores.length ? Math.max(...scores) : 0,
      totalQuestionsAnswered,
    },
    recentAttempts: completedAttempts.slice(0, 5).map((attempt) => ({
      attempt_id: attempt.result.attempt_id,
      quiz: attempt.result.quiz,
      percentage: attempt.result.percentage,
      status: attempt.result.status,
      correct_answers: attempt.result.correct_answers,
      total_questions: attempt.result.total_questions,
      submitted_at: attempt.result.submitted_at,
    })),
    performance: completedAttempts.slice(0, 7).reverse().map((attempt, index) => ({
      label: `Attempt ${index + 1}`,
      score: attempt.result.percentage,
    })),
  };
}

async function getPublishedQuiz(id) {
  const { data, error } = await supabase.from("quizzes").select(publicQuizSelect).eq("id", id).eq("status", "PUBLISHED").maybeSingle();
  if (error) throw error;
  return data;
}

function ownedAttempt(id, studentId) {
  const attempt = attempts.get(id);
  return attempt && attempt.studentId === studentId ? attempt : null;
}

function calculateResult(attempt, submittedAt, reason) {
  const answers = attempt.answers || {};
  const totalQuestions = attempt.scoringQuestions.length;
  const totalMarks = attempt.scoringQuestions.reduce((sum, question) => sum + Number(question.marks || 0), 0);
  let correctAnswers = 0;
  let obtainedMarks = 0;

  attempt.scoringQuestions.forEach((question) => {
    const correctOption = question.options.find((option) => option.is_correct);
    if (answers[question.id] && answers[question.id] === correctOption?.id) {
      correctAnswers += 1;
      obtainedMarks += Number(question.marks || 0);
    }
  });

  const answeredQuestionIds = Object.keys(answers);
  const incorrectAnswers = answeredQuestionIds.filter((questionId) => {
    const question = attempt.scoringQuestions.find((item) => item.id === questionId);
    return question && answers[questionId] !== question.options.find((option) => option.is_correct)?.id;
  }).length;
  const unanswered = totalQuestions - answeredQuestionIds.length;
  const percentage = totalMarks > 0 ? Math.round((obtainedMarks / totalMarks) * 100) : 0;
  const submittedTime = Date.parse(submittedAt);
  const review = attempt.scoringQuestions.map((question, index) => {
    const selectedOption = question.options.find((option) => option.id === answers[question.id]);
    const correctOption = question.options.find((option) => option.is_correct);

    return {
      question_number: index + 1,
      question_id: question.id,
      question: question.question_text,
      selected_answer: selectedOption?.option_text || null,
      correct_answer: correctOption?.option_text || null,
      is_correct: Boolean(selectedOption && selectedOption.id === correctOption?.id),
      explanation: question.explanation || "No explanation was provided for this question.",
    };
  });

  return {
    attempt_id: attempt.id,
    quiz: attempt.quiz,
    submitted_at: submittedAt,
    submission_reason: reason,
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    incorrect_answers: incorrectAnswers,
    unanswered,
    total_marks: totalMarks,
    obtained_marks: obtainedMarks,
    percentage,
    status: percentage >= Number(attempt.passingScore) ? "PASSED" : "FAILED",
    time_taken_seconds: Math.max(0, Math.floor((submittedTime - Date.parse(attempt.startedAt)) / 1000)),
    review,
  };
}

router.get("/", verifyToken, requireStudent, async (req, res) => {
  try {
    let query = supabase.from("quizzes").select(publicQuizSelect).eq("status", "PUBLISHED").order("created_at", { ascending: false });
    if (req.query.search) query = query.ilike("title", `%${String(req.query.search).trim()}%`);
    if (req.query.difficulty) query = query.eq("difficulty", String(req.query.difficulty).toUpperCase());
    if (req.query.category_id) query = query.eq("category_id", req.query.category_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.status(200).json({ quizzes: data || [] });
  } catch (error) {
    console.error("Student quiz listing error:", error);
    return res.status(500).json({ message: "Unable to fetch published quizzes" });
  }
});

router.get("/dashboard", verifyToken, requireStudent, (req, res) => {
  return res.status(200).json(dashboardForStudent(req.user.id));
});

router.patch("/attempts/:attemptId/answers", verifyToken, requireStudent, async (req, res) => {
  const attempt = ownedAttempt(req.params.attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });
  if (Date.now() >= Date.parse(attempt.expiresAt)) return res.status(410).json({ message: "This quiz attempt has expired" });
  const questionId = String(req.body?.question_id || "");
  const optionId = String(req.body?.option_id || "");
  const question = attempt.questions.find((item) => item.id === questionId);
  if (!question) return res.status(400).json({ message: "Question does not belong to this attempt" });
  if (!question.options.some((option) => option.id === optionId)) return res.status(400).json({ message: "Option does not belong to this question" });
  attempt.answers[questionId] = optionId;
  try {
    const { data: existing, error: lookupError } = await supabase.from("answers").select("id").eq("attempt_id", attempt.id).eq("question_id", questionId).maybeSingle();
    if (lookupError) throw lookupError;
    const payload = { attempt_id: attempt.id, question_id: questionId, selected_option_id: optionId, is_correct: question.options.find((option) => option.id === optionId)?.is_correct === true };
    const { error } = existing ? await supabase.from("answers").update(payload).eq("id", existing.id) : await supabase.from("answers").insert(payload);
    if (error) throw error;
    return res.status(200).json({ message: "Answer saved", answers: attempt.answers });
  } catch (error) {
    console.error("Save student answer error:", error);
    return res.status(500).json({ message: "Unable to save answer" });
  }
});

router.post("/attempts/:attemptId/submit", verifyToken, requireStudent, async (req, res) => {
  const attempt = ownedAttempt(req.params.attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });
  if (attempt.submitted) return res.status(409).json({ message: "This quiz attempt has already been submitted", result: attempt.result });

  const submittedAt = new Date();
  const expired = submittedAt.getTime() >= Date.parse(attempt.expiresAt);
  const result = calculateResult(attempt, submittedAt.toISOString(), expired ? "TIME_EXPIRED" : "MANUAL");
  attempt.submitted = true;
  attempt.result = result;
  try {
    const { error } = await supabase.from("attempts").update({ score: result.obtained_marks, percentage: result.percentage, correct_answers: result.correct_answers, incorrect_answers: result.incorrect_answers, unanswered: result.unanswered, time_taken: result.time_taken_seconds, status: "COMPLETED", completed_at: result.submitted_at }).eq("id", attempt.id).eq("user_id", req.user.id);
    if (error) throw error;
    return res.status(200).json({ message: expired ? "Quiz submitted automatically" : "Quiz submitted successfully", result });
  } catch (error) {
    attempt.submitted = false;
    attempt.result = null;
    console.error("Submit student quiz error:", error);
    return res.status(500).json({ message: "Unable to submit quiz" });
  }
});

router.get("/attempts/:attemptId/result", verifyToken, requireStudent, (req, res) => {
  const attempt = ownedAttempt(req.params.attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });
  if (!attempt.result) return res.status(409).json({ message: "This quiz has not been submitted yet" });
  return res.status(200).json({ result: attempt.result });
});

router.get("/attempts/history", verifyToken, requireStudent, (req, res) => {
  const history = Array.from(attempts.values())
    .filter((attempt) => attempt.studentId === req.user.id && attempt.result)
    .sort((first, second) => Date.parse(second.result.submitted_at) - Date.parse(first.result.submitted_at))
    .map((attempt) => attempt.result);

  return res.status(200).json({ history });
});

router.get("/attempts/:attemptId", verifyToken, requireStudent, (req, res) => {
  const attempt = ownedAttempt(req.params.attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });
  return res.status(200).json({ attempt: { id: attempt.id, quiz: attempt.quiz, started_at: attempt.startedAt, expires_at: attempt.expiresAt, questions: attempt.questions, answers: attempt.answers } });
});

router.get("/:id", verifyToken, requireStudent, async (req, res) => {
  try {
    const quiz = await getPublishedQuiz(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Published quiz not found" });
    const { count, error } = await supabase.from("questions").select("id", { count: "exact", head: true }).eq("quiz_id", quiz.id);
    if (error) throw error;
    return res.status(200).json({ quiz: { ...quiz, question_count: count ?? 0 } });
  } catch (error) {
    console.error("Student quiz details error:", error);
    return res.status(500).json({ message: "Unable to fetch quiz details" });
  }
});

router.post("/:id/start", verifyToken, requireStudent, async (req, res) => {
  try {
    const quiz = await getPublishedQuiz(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Published quiz not found" });
    const durationMinutes = Number(quiz.duration);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return res.status(400).json({ message: "This quiz has an invalid duration. Ask an admin to update it." });
    const { data: questions, error } = await supabase.from("questions").select(questionSelect).eq("quiz_id", quiz.id).order("created_at", { ascending: true });
    if (error) throw error;
    if (!questions?.length) return res.status(400).json({ message: "This quiz has no questions yet" });

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
    const safeQuestions = questions.map(({ options, ...question }) => ({ ...question, options: (options || []).map(({ is_correct, ...option }) => option) }));
    const { data: savedAttempt, error: attemptError } = await supabase.from("attempts").insert({ quiz_id: quiz.id, user_id: req.user.id, status: "IN_PROGRESS", started_at: startedAt.toISOString() }).select("id").single();
    if (attemptError) throw attemptError;
    const attempt = { id: savedAttempt.id, quizId: quiz.id, studentId: req.user.id, passingScore: quiz.passing_score, quiz: { id: quiz.id, title: quiz.title, duration: durationMinutes }, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), questions: safeQuestions, scoringQuestions: questions, answers: {} };
    attempts.set(attempt.id, attempt);
    return res.status(201).json({ attempt: { id: attempt.id, quiz: attempt.quiz, started_at: attempt.startedAt, expires_at: attempt.expiresAt, questions: attempt.questions, answers: attempt.answers } });
  } catch (error) {
    console.error("Start student quiz error:", error);
    return res.status(500).json({ message: "Unable to start quiz" });
  }
});

export default router;
