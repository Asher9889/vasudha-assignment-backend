import z from "zod";
import { forgotPasswordSchema, resetPasswordSchema } from "./password-reset.schema";

type TForgotPasswordRequestDTO = z.infer<typeof forgotPasswordSchema>;
type TResetPasswordRequestDTO = z.infer<typeof resetPasswordSchema>;

type TResetPasswordLinkPayload = {
    email: string;
    resetUrl: string;
};

export type { TForgotPasswordRequestDTO, TResetPasswordRequestDTO, TResetPasswordLinkPayload };