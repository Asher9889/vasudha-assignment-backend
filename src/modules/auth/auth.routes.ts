import express from "express";
import { authController } from "./auth.module";
import schemaValidate from "../../middlewares/schemaValidate";
import { loginSchema } from "./auth.schema";

const router = express.Router();

router.post("/login", schemaValidate(loginSchema), authController.login);
 
export default router;