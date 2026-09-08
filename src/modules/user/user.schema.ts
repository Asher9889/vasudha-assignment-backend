import z from "zod";
import { USER_ROLE } from "./user.types";
import { ACCOUNT_STATUS } from "./user.constant";

const createUserSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }).max(20, { message: "Password must be at most 20 characters long" }),
  role: z.enum(Object.values(USER_ROLE), { message: `Valid values are: ${Object.values(USER_ROLE).join(", ")}` }),
  accountStatus: z.enum(Object.values(ACCOUNT_STATUS), { message: `Valid values are: ${Object.values(ACCOUNT_STATUS).join(", ")}` }).default(ACCOUNT_STATUS.ACTIVE),
});

export { createUserSchema };