import express from "express";
import { verifyToken, requireStudent } from "../../middleware/auth.js";

const router = express.Router();

router.get("/dashboard", verifyToken, requireStudent, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Student dashboard access granted",
      user: {
        id: req.user.id,
        role: req.user.role,
      },
      stats: {
        totalQuizzes: 0,
        totalAttempts: 0,
        averageScore: 0,
        completed: 0,
      },
    });
  } catch (error) {
    console.error("Student dashboard error:", error);
    return res.status(500).json({ message: "Unable to load student dashboard" });
  }
});

export default router;
