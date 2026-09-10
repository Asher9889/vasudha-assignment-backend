import express from "express";
import { userController } from "./user.module";
import authenticate from "../../middlewares/authenticate";
import { USER_ROLE } from "./user.types";
import { createUserSchema, updateAccountStatusSchema, objectIdParamSchema, getAllUsersQuerySchema } from "./user.schema";
import { schemaValidate, paramsValidate, queryValidate, authorize } from "../../middlewares";

const router = express.Router();

const { SUPER_ADMIN } = USER_ROLE;

router.get("/", authenticate, authorize(SUPER_ADMIN), queryValidate(getAllUsersQuerySchema), userController.getAllUsers);
router.post("/", authenticate, authorize(SUPER_ADMIN), schemaValidate(createUserSchema), userController.createUser);
router.patch("/:id/status", authenticate, authorize(SUPER_ADMIN), paramsValidate(objectIdParamSchema), schemaValidate(updateAccountStatusSchema), userController.updateAccountStatus);

export default router;