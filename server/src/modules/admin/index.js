import express from "express";
import { verifyToken, requireAdmin } from "../../middleware/auth.js";
import supabase from "../../config/supabase.js";

const router = express.Router();

router.get("/dashboard", verifyToken, requireAdmin, async (req, res) => {
  try {
    const [{ count: totalStudents }, { count: totalQuizzes }, { count: totalQuestions }, { count: totalAttempts }, { count: totalPassed }, { count: totalFailed }] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "STUDENT"),
      supabase.from("quizzes").select("id", { count: "exact", head: true }),
      supabase.from("questions").select("id", { count: "exact", head: true }),
      supabase.from("quiz_attempts").select("id", { count: "exact", head: true }),
      supabase.from("results").select("id", { count: "exact", head: true }).eq("passed", true),
      supabase.from("results").select("id", { count: "exact", head: true }).eq("passed", false),
    ]);

    return res.status(200).json({
      stats: {
        totalStudents: totalStudents ?? 0,
        totalQuizzes: totalQuizzes ?? 0,
        totalQuestions: totalQuestions ?? 0,
        totalAttempts: totalAttempts ?? 0,
        totalPassed: totalPassed ?? 0,
        totalFailed: totalFailed ?? 0,
      },
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return res.status(500).json({ message: "Unable to load admin dashboard" });
  }
});

router.get("/attempts", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("*, users(name,email), quizzes(title)")
      .order("started_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ attempts: data || [] });
  } catch (error) {
    console.error("Get admin attempts error:", error);
    return res.status(500).json({ message: "Unable to fetch attempts" });
  }
});

router.get("/analytics", verifyToken, requireAdmin, async (req, res) => {
  return res.status(200).json({
    message: "Admin analytics endpoint ready for future charts and reporting modules.",
    summary: {
      attemptTrend: [],
      registrations: [],
      averageScores: [],
      passRate: [],
    },
  });
});

export default router;
