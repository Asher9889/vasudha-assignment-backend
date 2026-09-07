import mongoose from "mongoose";
import { USER_ROLE } from "./auth.constants";
import { userSchema } from "./auth.model";

type TUser = mongoose.InferRawDocType<typeof userSchema>; 
type TUserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

export type { TUserRole, TUser };