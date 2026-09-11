import express from "express";
import { authRoutes } from "../../modules/auth";
import { userRoutes } from "../../modules/user";
import { datasetRoutes } from "../../modules/dataset";
import { passwordResetRoutes } from "../../modules/password-reset";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/auth", passwordResetRoutes);
router.use("/users", userRoutes);
router.use("/datasets", datasetRoutes);

export default router;