import crypto from "crypto";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { body, validationResult } from "express-validator";
import supabase from "../../config/supabase.js";
import { JWT_SECRET, RESEND_API_KEY, FRONTEND_URL, RESEND_FROM_EMAIL, NODE_ENV } from "../../config/constants.js";

const router = express.Router();
const resetTokens = new Map();
const resend = new Resend(RESEND_API_KEY);

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const buildFrontendUrl = () => FRONTEND_URL;

const sendResetEmail = async (email, resetLink) => {
  if (!RESEND_API_KEY) {
    console.log(`[DEV RESET LINK] Reset email for ${email}: ${resetLink}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: email,
    subject: "Reset your Quiz Management password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Password Reset Request</h2>
        <p>We received a request to reset your password.</p>
        <p><a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Reset Password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message || "Resend email delivery failed");
  }
};

router.post("/register", [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("email").trim().isEmail().withMessage("Please enter a valid email"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);

    try {
      const { data: existing, error: selectError } = await supabase.from("users").select("id,email").eq("email", normalizedEmail).limit(1).maybeSingle();

      if (selectError) throw selectError;
      if (existing) {
        return res.status(400).json({ message: "User already exists with this email" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userRole = role === "ADMIN" ? "ADMIN" : "STUDENT";

      const { data, error } = await supabase.from("users").insert({
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: userRole,
        status: "ACTIVE",
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;

      const token = jwt.sign({ id: data.id, role: data.role }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(201).json({
        message: "Registration successful",
        user: { id: data.id, name: data.name, email: data.email, role: data.role },
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Server error while registering user" });
    }
  }
);

router.post("/login", [
    body("email").trim().isEmail().withMessage("Please enter a valid email"),
    body("password").exists().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const selectedRole = role === "ADMIN" ? "ADMIN" : "STUDENT";

    try {
      const { data: user, error } = await supabase.from("users").select("id,name,email,password,role,status").eq("email", normalizedEmail).limit(1).maybeSingle();

      if (error) throw error;
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      if (user.status && user.status !== "ACTIVE") {
        return res.status(403).json({ message: "This account is not active" });
      }

      if (user.role !== selectedRole) {
        return res.status(403).json({ message: `This email is registered as ${user.role.toLowerCase()}. Please select the correct role.` });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        message: "Login successful",
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error while logging in" });
    }
  }
);

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  return res.status(200).json({ message: "Logged out successfully" });
});

router.get("/me", async (req, res) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { id } = decoded;

    const { data: user, error } = await supabase
      .from("users")
      .select("id,name,email,role,status")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

router.post(
  "/forgot-password",
  [body("email").trim().isEmail().withMessage("Please enter a valid email")],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    try {
      const { data: user, error } = await supabase
        .from("users")
        .select("id,email")
        .eq("email", normalizedEmail)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!user) {
        return res.status(200).json({
          message: "If an account exists for this email, a reset link has been sent.",
        });
      }

      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 60 * 60 * 1000;
      resetTokens.set(token, { email: normalizedEmail, userId: user.id, expiresAt });

      const resetLink = `${buildFrontendUrl()}/auth/reset-password?token=${token}`;
      await sendResetEmail(normalizedEmail, resetLink);

      return res.status(200).json({
        message: "If an account exists for this email, a reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      return res.status(500).json({ message: "Unable to send reset link" });
    }
  }
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    const resetEntry = resetTokens.get(token);

    if (!resetEntry) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    if (Date.now() > resetEntry.expiresAt) {
      resetTokens.delete(token);
      return res.status(400).json({ message: "Reset link has expired" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { error } = await supabase
        .from("users")
        .update({ password: hashedPassword })
        .eq("id", resetEntry.userId)
        .eq("email", resetEntry.email);

      if (error) throw error;

      resetTokens.delete(token);

      return res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ message: "Unable to reset password" });
    }
  }
);

export default router;
