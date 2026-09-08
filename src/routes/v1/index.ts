import express from "express";
import { authRoutes } from "../../modules/auth";
import { userRoutes } from "../../modules/user";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);

export default router;