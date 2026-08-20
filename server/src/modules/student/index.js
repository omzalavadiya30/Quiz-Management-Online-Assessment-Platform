import express from "express";
import { verifyToken, requireStudent } from "../../middleware/auth.js";
import { dashboardForStudent } from "../studentQuizzes/index.js";

const router = express.Router();

router.get("/dashboard", verifyToken, requireStudent, (req, res) => {
  return res.status(200).json(dashboardForStudent(req.user.id));
});

export default router;
