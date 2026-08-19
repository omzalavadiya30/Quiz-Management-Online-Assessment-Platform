import express from "express";
import supabase from "../../config/supabase.js";
import { verifyToken, requireAdmin } from "../../middleware/auth.js";

const router = express.Router();

const VALID_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const VALID_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const normalizeQuizPayload = (payload = {}) => {
  const title = (payload.title ?? "").trim();
  const description = (payload.description ?? "").trim();
  const categoryId = payload.category_id ?? payload.categoryId ?? "";
  const difficulty = (payload.difficulty ?? "MEDIUM").toUpperCase();
  const duration = Number(payload.duration ?? 0);
  const passingScore = Number(payload.passing_score ?? payload.passingScore ?? 0);
  const maxAttempts = Number(payload.max_attempts ?? payload.maxAttempts ?? 1);
  const status = (payload.status ?? "DRAFT").toUpperCase();

  if (!title) {
    throw new Error("Quiz title is required");
  }

  if (!categoryId) {
    throw new Error("Category is required");
  }

  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    throw new Error("Difficulty must be EASY, MEDIUM, or HARD");
  }

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("Duration must be a positive number");
  }

  if (!Number.isFinite(passingScore) || passingScore < 0 || passingScore > 100) {
    throw new Error("Passing score must be between 0 and 100");
  }

  if (!Number.isFinite(maxAttempts) || maxAttempts <= 0) {
    throw new Error("Max attempts must be greater than 0");
  }

  if (!VALID_STATUSES.includes(status)) {
    throw new Error("Status must be DRAFT, PUBLISHED, or ARCHIVED");
  }

  return {
    title,
    description,
    category_id: categoryId,
    difficulty,
    duration,
    passing_score: passingScore,
    max_attempts: maxAttempts,
    status,
  };
};

router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*, categories(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.status(200).json({ quizzes: data || [] });
  } catch (error) {
    console.error("Get quizzes error:", error);
    return res.status(500).json({ message: "Unable to fetch quizzes" });
  }
});

router.get("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("quizzes")
      .select("*, categories(name)")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    return res.status(200).json({ quiz: data });
  } catch (error) {
    console.error("Get quiz error:", error);
    return res.status(500).json({ message: "Unable to fetch quiz" });
  }
});

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const payload = normalizeQuizPayload(req.body);

    const { data, error } = await supabase
      .from("quizzes")
      .insert([
        {
          ...payload,
          updated_at: new Date().toISOString(),
        },
      ])
      .select("*, categories(name)")
      .single();

    if (error) throw error;

    return res.status(201).json({ message: "Quiz created successfully", quiz: data });
  } catch (error) {
    console.error("Create quiz error:", error);
    const message = error instanceof Error ? error.message : "Unable to create quiz";
    return res.status(400).json({ message });
  }
});

router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizeQuizPayload(req.body);

    const { data, error } = await supabase
      .from("quizzes")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, categories(name)")
      .single();

    if (error) throw error;

    return res.status(200).json({ message: "Quiz updated successfully", quiz: data });
  } catch (error) {
    console.error("Update quiz error:", error);
    const message = error instanceof Error ? error.message : "Unable to update quiz";
    return res.status(400).json({ message });
  }
});

router.patch("/:id/publish", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { published } = req.body;
    const nextStatus = published === false ? "DRAFT" : "PUBLISHED";

    const { data, error } = await supabase
      .from("quizzes")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", req.params.id)
      .select("*, categories(name)")
      .single();

    if (error) throw error;

    return res.status(200).json({
      message: nextStatus === "PUBLISHED" ? "Quiz published successfully" : "Quiz unpublished successfully",
      quiz: data,
    });
  } catch (error) {
    console.error("Toggle quiz publish error:", error);
    return res.status(500).json({ message: "Unable to update quiz publication status" });
  }
});

router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("quizzes").delete().eq("id", id);

    if (error) throw error;

    return res.status(200).json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Delete quiz error:", error);
    return res.status(500).json({ message: "Unable to delete quiz" });
  }
});

export default router;
