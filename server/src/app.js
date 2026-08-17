import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/index.js";
import adminRouter from "./modules/admin/index.js";
import studentRouter from "./modules/student/index.js";
import usersRouter from "./modules/users/index.js";
import leaderboardRouter from "./modules/leaderboard/index.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(compression());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth routes
app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/student", studentRouter);
app.use("/api/users", usersRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Quiz Management API is running",
    });
});

export default app;