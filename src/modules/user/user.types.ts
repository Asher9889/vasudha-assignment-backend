import { USER_ROLE, ACCOUNT_STATUS } from "./user.constant";
import { createUserSchema, updateAccountStatusSchema } from "./user.schema";
import z from "zod";

type TUserRole = typeof USER_ROLE[keyof typeof USER_ROLE];
type TAccountStatus = typeof ACCOUNT_STATUS[keyof typeof ACCOUNT_STATUS];

type TCreateUserPayload = z.infer<typeof createUserSchema>;
type TUpdateAccountStatusPayload = z.infer<typeof updateAccountStatusSchema>;

export type { TUserRole, TAccountStatus, TCreateUserPayload, TUpdateAccountStatusPayload };
export { USER_ROLE };