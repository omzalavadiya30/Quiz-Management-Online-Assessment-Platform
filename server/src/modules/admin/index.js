import express from "express";
import { verifyToken, requireAdmin } from "../../middleware/auth.js";
import supabase from "../../config/supabase.js";

const router = express.Router();

router.get("/dashboard", verifyToken, requireAdmin, async (req, res) => {
  try {
    const [{ count: totalStudents }, { count: totalQuizzes }, { count: totalQuestions }, { count: totalAttempts }] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }).eq("role", "STUDENT"),
      supabase.from("quizzes").select("id", { count: "exact", head: true }),
      supabase.from("questions").select("id", { count: "exact", head: true }),
      supabase.from("attempts").select("id", { count: "exact", head: true }),
    ]);

    return res.status(200).json({
      stats: {
        totalStudents: totalStudents ?? 0,
        totalQuizzes: totalQuizzes ?? 0,
        totalQuestions: totalQuestions ?? 0,
        totalAttempts: totalAttempts ?? 0,
        totalPassed: 0,
        totalFailed: 0,
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
      .from("attempts")
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
  try {
    const [{ data: students, error: studentsError }, { data: quizzes, error: quizzesError }, { data: attempts, error: attemptsError }] = await Promise.all([
      supabase.from("users").select("id,created_at").eq("role", "STUDENT"),
      supabase.from("quizzes").select("id,title,passing_score,status,created_at"),
      supabase.from("attempts").select("id,quiz_id,user_id,percentage,status,started_at,completed_at").order("started_at", { ascending: true }),
    ]);
    if (studentsError) throw studentsError;
    if (quizzesError) throw quizzesError;
    if (attemptsError) throw attemptsError;

    const quizById = new Map((quizzes || []).map((quiz) => [quiz.id, quiz]));
    const completed = (attempts || []).filter((attempt) => attempt.status === "COMPLETED" || attempt.status === "SUBMITTED");
    const passed = completed.filter((attempt) => Number(attempt.percentage || 0) >= Number(quizById.get(attempt.quiz_id)?.passing_score || 0));
    const failed = completed.length - passed.length;
    const dateKey = (value) => new Date(value).toISOString().slice(0, 10);
    const labels = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return dateKey(date); });
    const trend = labels.map((date) => {
      const daily = completed.filter((attempt) => dateKey(attempt.completed_at || attempt.started_at) === date);
      const dailyPassed = daily.filter((attempt) => Number(attempt.percentage || 0) >= Number(quizById.get(attempt.quiz_id)?.passing_score || 0));
      return { date, label: new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" }), attempts: daily.length, averageScore: daily.length ? Math.round(daily.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) / daily.length) : 0, passRate: daily.length ? Math.round((dailyPassed.length / daily.length) * 100) : 0 };
    });
    const quizStats = (quizzes || []).map((quiz) => {
      const quizAttempts = completed.filter((attempt) => attempt.quiz_id === quiz.id);
      const quizPassed = quizAttempts.filter((attempt) => Number(attempt.percentage || 0) >= Number(quiz.passing_score || 0));
      return { id: quiz.id, title: quiz.title, attempts: quizAttempts.length, averageScore: quizAttempts.length ? Math.round(quizAttempts.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) / quizAttempts.length) : 0, passRate: quizAttempts.length ? Math.round((quizPassed.length / quizAttempts.length) * 100) : 0 };
    }).sort((a, b) => b.attempts - a.attempts).slice(0, 5);

    return res.status(200).json({
      studentStats: { total: students?.length || 0, active: new Set((attempts || []).map((attempt) => attempt.user_id)).size, newThisWeek: (students || []).filter((student) => Date.parse(student.created_at) >= Date.now() - 7 * 86400000).length },
      quizStats: { total: quizzes?.length || 0, published: (quizzes || []).filter((quiz) => quiz.status === "PUBLISHED").length, mostAttempted: quizStats[0]?.title || "No attempts yet", byQuiz: quizStats },
      attemptStats: { total: attempts?.length || 0, completed: completed.length, inProgress: (attempts || []).filter((attempt) => attempt.status === "IN_PROGRESS").length, averageScore: completed.length ? Math.round(completed.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) / completed.length) : 0 },
      passFail: { passed: passed.length, failed, passRate: completed.length ? Math.round((passed.length / completed.length) * 100) : 0 },
      trend,
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return res.status(500).json({ message: "Unable to load analytics" });
  }
});

export default router;
