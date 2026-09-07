import mongoose from "mongoose";
import z from "zod";

import { USER_ROLE } from "./auth.constants";
import { loginSchema } from "./auth.schema";


type TUserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

type TLoginRequestDTO = z.infer<typeof loginSchema>;

export type { TUserRole, TLoginRequestDTO };