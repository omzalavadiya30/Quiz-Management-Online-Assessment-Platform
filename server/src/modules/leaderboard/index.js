import express from "express";
import { verifyToken } from "../../middleware/auth.js";
import supabase from "../../config/supabase.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("results")
      .select("*, users(name,email)")
      .order("percentage", { ascending: false })
      .limit(20);

    if (error) throw error;
    return res.status(200).json({ leaderboard: data || [] });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({ message: "Unable to fetch leaderboard" });
  }
});

export default router;
