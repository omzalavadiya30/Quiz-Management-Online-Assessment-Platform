import express from "express";
import supabase from "../../config/supabase.js";
import { verifyToken, requireAdmin } from "../../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,description,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ categories: data || [] });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ message: "Unable to fetch categories" });
  }
});

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const name = (req.body?.name ?? "").trim();
    const description = (req.body?.description ?? "").trim();

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([{ name, description }])
      .select()
      .single();

    if (error) throw error;
    return res.status(201).json({ message: "Category created successfully", category: data });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({ message: "Unable to create category" });
  }
});

export default router;
