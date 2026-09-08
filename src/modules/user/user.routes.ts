import express from "express";
import { userController } from "./user.module";
import authenticate from "../../middlewares/authenticate";
import { authorize } from "../../middlewares";
import { USER_ROLE } from "./user.types";

const router = express.Router();

const { ADMIN, SUPER_ADMIN } = USER_ROLE;

router.post("/", authenticate, authorize(SUPER_ADMIN), userController.createUser);

export default router;