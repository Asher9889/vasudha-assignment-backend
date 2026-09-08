import express from "express";
import { authController } from "./auth.module";
import { authenticate, schemaValidate } from "../../middlewares";
import { loginSchema } from "./auth.schema";

const router = express.Router();

router.post("/login", schemaValidate(loginSchema), authController.login);
router.post("/refresh", authenticate, authController.refresh);
router.get("/me", authenticate, authController.getMe);


export default router;