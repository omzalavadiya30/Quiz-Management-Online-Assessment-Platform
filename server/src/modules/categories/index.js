import express from "express";
import supabase from "../../config/supabase.js";
import { verifyToken, requireAdmin } from "../../middleware/auth.js";

const router = express.Router();

const normalizeCategoryPayload = (payload = {}) => {
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const description = typeof payload.description === "string" ? payload.description.trim() : "";

  if (!name) throw new Error("Category name is required");
  if (name.length < 2) throw new Error("Category name must be at least 2 characters");
  if (name.length > 80) throw new Error("Category name must be 80 characters or fewer");
  if (description.length > 300) throw new Error("Description must be 300 characters or fewer");

  return { name, description };
};

router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,description,created_at,quizzes(id,title,status)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ categories: data || [] });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ message: "Unable to fetch categories" });
  }
});

router.get("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,description,created_at,quizzes(id,title,status)")
      .eq("id", req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "Category not found" });

    return res.status(200).json({ category: data });
  } catch (error) {
    console.error("Get category error:", error);
    return res.status(500).json({ message: "Unable to fetch category" });
  }
});

router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const payload = normalizeCategoryPayload(req.body);

    const { data, error } = await supabase
      .from("categories")
      .insert([payload])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") return res.status(409).json({ message: "A category with this name already exists" });
      throw error;
    }
    return res.status(201).json({ message: "Category created successfully", category: data });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(400).json({ message: error instanceof Error ? error.message : "Unable to create category" });
  }
});

router.put("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const payload = normalizeCategoryPayload(req.body);

    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", req.params.id)
      .select("id,name,description,created_at,quizzes(id,title,status)")
      .single();

    if (error) {
      if (error.code === "23505") return res.status(409).json({ message: "A category with this name already exists" });
      throw error;
    }
    if (!data) return res.status(404).json({ message: "Category not found" });
    return res.status(200).json({ message: "Category updated successfully", category: data });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(400).json({ message: "Unable to update category" });
  }
});

router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data: existingCategory, error: existingError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", req.params.id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existingCategory) return res.status(404).json({ message: "Category not found" });

    const { error } = await supabase.from("categories").delete().eq("id", req.params.id);

    if (error) throw error;
    return res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({ message: "Unable to delete category" });
  }
});

export default router;
