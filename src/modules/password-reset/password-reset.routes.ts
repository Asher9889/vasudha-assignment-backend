import express from "express";
import { passwordResetController } from "./password-reset.module";
import { schemaValidate } from "../../middlewares";
import { forgotPasswordSchema, resetPasswordSchema } from "./password-reset.schema";

const router = express.Router();

router.post("/forgot-password", schemaValidate(forgotPasswordSchema), passwordResetController.forgotPassword);
router.post("/reset-password", schemaValidate(resetPasswordSchema), passwordResetController.resetPassword);

export default router;