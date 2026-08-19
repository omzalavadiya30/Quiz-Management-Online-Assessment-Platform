import crypto from "crypto";
import express from "express";
import supabase from "../../config/supabase.js";
import { verifyToken, requireStudent } from "../../middleware/auth.js";

const router = express.Router();
const attempts = new Map();
const publicQuizSelect = "id,title,description,category_id,difficulty,duration,passing_score,max_attempts,status,created_at,categories(name)";
const questionSelect = "id,quiz_id,question_text,marks,difficulty,options(id,option_text,is_correct)";

async function getPublishedQuiz(id) {
  const { data, error } = await supabase.from("quizzes").select(publicQuizSelect).eq("id", id).eq("status", "PUBLISHED").maybeSingle();
  if (error) throw error;
  return data;
}

function ownedAttempt(id, studentId) {
  const attempt = attempts.get(id);
  return attempt && attempt.studentId === studentId ? attempt : null;
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

router.get("/attempts/:attemptId", verifyToken, requireStudent, (req, res) => {
  const attempt = ownedAttempt(req.params.attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });
  return res.status(200).json({ attempt: { id: attempt.id, quiz: attempt.quiz, started_at: attempt.startedAt, expires_at: attempt.expiresAt, questions: attempt.questions, answers: attempt.answers } });
});

router.patch("/attempts/:attemptId/answers", verifyToken, requireStudent, (req, res) => {
  const attempt = ownedAttempt(req.params.attemptId, req.user.id);
  if (!attempt) return res.status(404).json({ message: "Quiz attempt not found" });
  if (Date.now() >= Date.parse(attempt.expiresAt)) return res.status(410).json({ message: "This quiz attempt has expired" });
  const questionId = String(req.body?.question_id || "");
  const optionId = String(req.body?.option_id || "");
  const question = attempt.questions.find((item) => item.id === questionId);
  if (!question) return res.status(400).json({ message: "Question does not belong to this attempt" });
  if (!question.options.some((option) => option.id === optionId)) return res.status(400).json({ message: "Option does not belong to this question" });
  attempt.answers[questionId] = optionId;
  return res.status(200).json({ message: "Answer saved", answers: attempt.answers });
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
    const attempt = { id: crypto.randomUUID(), quizId: quiz.id, studentId: req.user.id, quiz: { id: quiz.id, title: quiz.title, duration: durationMinutes }, startedAt: startedAt.toISOString(), expiresAt: expiresAt.toISOString(), questions: safeQuestions, answers: {} };
    attempts.set(attempt.id, attempt);
    return res.status(201).json({ attempt: { id: attempt.id, quiz: attempt.quiz, started_at: attempt.startedAt, expires_at: attempt.expiresAt, questions: attempt.questions, answers: attempt.answers } });
  } catch (error) {
    console.error("Start student quiz error:", error);
    return res.status(500).json({ message: "Unable to start quiz" });
  }
});

export default router;
