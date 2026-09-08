import express from "express";
import { userController } from "./user.module";
import authenticate from "../../middlewares/authenticate";
import { authorize } from "../../middlewares";
import { USER_ROLE } from "./user.types";
import { createUserSchema } from "./user.schema";
import { schemaValidate } from "../../middlewares";

const router = express.Router();

const {SUPER_ADMIN } = USER_ROLE;

router.post("/", authenticate, authorize(SUPER_ADMIN), schemaValidate(createUserSchema), userController.createUser);

export default router;