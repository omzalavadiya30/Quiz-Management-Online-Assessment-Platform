import express from "express";
import { verifyToken, requireAdmin } from "../../middleware/auth.js";
import supabase from "../../config/supabase.js";

const router = express.Router();

router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id,name,email,role,status,created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return res.status(200).json({ users: data || [] });
  } catch (error) {
    console.error("Get users error:", error);
    return res.status(500).json({ message: "Unable to fetch users" });
  }
});

router.get("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("users")
      .select("id,name,email,role,status,created_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ user: data });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ message: "Unable to fetch user" });
  }
});

router.patch("/:id/status", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({ message: "Status must be ACTIVE or INACTIVE" });
    }

    const { data, error } = await supabase
      .from("users")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return res.status(200).json({ message: "User status updated", user: data });
  } catch (error) {
    console.error("Update user status error:", error);
    return res.status(500).json({ message: "Unable to update user status" });
  }
});

router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) throw error;
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Unable to delete user" });
  }
});

export default router;
