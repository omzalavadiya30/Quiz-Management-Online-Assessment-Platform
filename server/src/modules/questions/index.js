import express from "express";
import supabase from "../../config/supabase.js";
import { verifyToken, requireAdmin } from "../../middleware/auth.js";

const router = express.Router();
const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

const normalizePayload = (payload = {}) => {
  const questionText = String(payload.question_text ?? payload.questionText ?? "").trim();
  const explanation = String(payload.explanation ?? "").trim();
  const marks = Number(payload.marks ?? 1);
  const difficulty = String(payload.difficulty ?? "MEDIUM").toUpperCase();
  const quizId = payload.quiz_id ?? payload.quizId ?? "";
  const options = Array.isArray(payload.options)
    ? payload.options.map((option) => ({
        text: String(option.text ?? option.option_text ?? "").trim(),
        is_correct: Boolean(option.is_correct ?? option.isCorrect),
      }))
    : [];

  if (!quizId) throw new Error("Quiz is required");
  if (!questionText) throw new Error("Question text is required");
  if (questionText.length < 10 || questionText.length > 500) throw new Error("Question must be between 10 and 500 characters");
  if (options.length !== 4 || options.some((option) => !option.text)) {
    throw new Error("Exactly four non-empty options are required");
  }
  if (options.some((option) => option.text.length > 200)) throw new Error("Each option must be 200 characters or fewer");
  const normalizedOptions = options.map((option) => option.text.toLowerCase());
  if (new Set(normalizedOptions).size !== normalizedOptions.length) throw new Error("Options must be different from each other");
  if (options.filter((option) => option.is_correct).length !== 1) {
    throw new Error("Select exactly one correct answer");
  }
  if (!Number.isFinite(marks) || marks <= 0 || marks > 100) throw new Error("Marks must be greater than 0 and no more than 100");
  if (explanation.length > 1000) throw new Error("Explanation must be 1,000 characters or fewer");
  if (!VALID_DIFFICULTIES.includes(difficulty)) throw new Error("Difficulty must be EASY, MEDIUM, or HARD");

  return { quiz_id: quizId, question_text: questionText, explanation, marks, difficulty, options };
};

const questionSelect = "id,quiz_id,question_text,explanation,marks,difficulty,created_at,question_options:options(id,option_text,is_correct)";

router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    let query = supabase.from("questions").select(questionSelect).order("created_at", { ascending: true });
    if (req.query.quiz_id) query = query.eq("quiz_id", req.query.quiz_id);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ questions: data || [] });
  } catch (error) {
    console.error("Get questions error:", error);
    return res.status(500).json({ message: "Unable to fetch questions" });
  }
});

router.get("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("questions")
      .select(questionSelect)
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Question not found" });

    return res.status(200).json({ question: data });
  } catch (error) {
    console.error("Get question error:", error);
    return res.status(500).json({ message: "Unable to fetch question" });
  }
});

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { options, ...question } = normalizePayload(req.body);
    const { data: quiz, error: quizError } = await supabase.from("quizzes").select("id").eq("id", question.quiz_id).maybeSingle();
    if (quizError) throw quizError;
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const { data, error } = await supabase
      .from("questions")
      .insert([question])
      .select("id")
      .single();

    if (error) throw error;

    const { error: optionsError } = await supabase.from("options").insert(
      options.map((option) => ({
        question_id: data.id,
        option_text: option.text,
        is_correct: option.is_correct,
      }))
    );

    if (optionsError) {
      await supabase.from("questions").delete().eq("id", data.id);
      throw optionsError;
    }

    const { data: created, error: fetchError } = await supabase
      .from("questions")
      .select(questionSelect)
      .eq("id", data.id)
      .single();

    if (fetchError) throw fetchError;
    return res.status(201).json({ message: "Question created successfully", question: created });
  } catch (error) {
    console.error("Create question error:", error);
    return res.status(400).json({ message: error instanceof Error ? error.message : "Unable to create question" });
  }
});

router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { options, ...question } = normalizePayload(req.body);
    const { data: quiz, error: quizError } = await supabase.from("quizzes").select("id").eq("id", question.quiz_id).maybeSingle();
    if (quizError) throw quizError;
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const { data: existingQuestion, error: existingError } = await supabase.from("questions").select("id").eq("id", req.params.id).maybeSingle();
    if (existingError) throw existingError;
    if (!existingQuestion) return res.status(404).json({ message: "Question not found" });

    const { error } = await supabase
      .from("questions")
      .update(question)
      .eq("id", req.params.id);

    if (error) throw error;

    const { error: deleteOptionsError } = await supabase
      .from("options")
      .delete()
      .eq("question_id", req.params.id);
    if (deleteOptionsError) throw deleteOptionsError;

    const { error: optionsError } = await supabase.from("options").insert(
      options.map((option) => ({
        question_id: req.params.id,
        option_text: option.text,
        is_correct: option.is_correct,
      }))
    );
    if (optionsError) throw optionsError;

    const { data, error: fetchError } = await supabase
      .from("questions")
      .select(questionSelect)
      .eq("id", req.params.id)
      .single();
    if (fetchError) throw fetchError;

    return res.status(200).json({ message: "Question updated successfully", question: data });
  } catch (error) {
    console.error("Update question error:", error);
    return res.status(400).json({ message: error instanceof Error ? error.message : "Unable to update question" });
  }
});

router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data: existingQuestion, error: existingError } = await supabase
      .from("questions")
      .select("id")
      .eq("id", req.params.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existingQuestion) return res.status(404).json({ message: "Question not found" });

    const { error: optionsError } = await supabase.from("options").delete().eq("question_id", req.params.id);
    if (optionsError) throw optionsError;

    const { error } = await supabase.from("questions").delete().eq("id", req.params.id);
    if (error) throw error;

    return res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Delete question error:", error);
    return res.status(500).json({ message: "Unable to delete question" });
  }
});

export default router;
