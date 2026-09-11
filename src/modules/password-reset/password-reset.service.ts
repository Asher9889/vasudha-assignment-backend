import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { envConfig } from "../../config";
import { eventBus } from "../../events";
import { ApiError } from "../../utils";
import { UserModel } from "../user";
import PasswordResetTokenModel from "./password-reset.model";
import { PASSWORD_RESET_EVENTS } from "./password-reset.constants";
import { TForgotPasswordRequestDTO, TResetPasswordRequestDTO, TResetPasswordLinkPayload } from "./password-reset.types";

class PasswordResetService {

    forgotPassword = async ({ email }: TForgotPasswordRequestDTO) => {
        try {
            const user = await UserModel.findOne({ email });

            if (user) {
                // Invalidate any existing active reset tokens before creating a new one
                await PasswordResetTokenModel.deleteMany({ userId: user._id, usedAt: null });

                const rawToken = crypto.randomBytes(32).toString("hex");
                const tokenHash = this.hashToken(rawToken);

                await PasswordResetTokenModel.create({
                    userId: user._id,
                    tokenHash,
                    expiresAt: new Date(Date.now() + envConfig.passwordReset.tokenTTLMs),
                    usedAt: null,
                });

                const resetUrl = `${envConfig.frontendUrl}/reset-password?token=${rawToken}`;
                const payload: TResetPasswordLinkPayload = { email: user.email, resetUrl };

                eventBus.emit(PASSWORD_RESET_EVENTS.REQUESTED, payload);
            }

            // Generic response 
            return { message: "If an account exists for this email, a password reset link has been sent." };
        } catch (error) {
            throw error;
        }
    }

    resetPassword = async ({ token, password }: TResetPasswordRequestDTO) => {
        try {
            const tokenHash = this.hashToken(token);

            const resetToken = await PasswordResetTokenModel.findOne({ tokenHash });
            if (!resetToken || resetToken.usedAt || resetToken.expiresAt.getTime() <= Date.now()) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired password reset token");
            }

            const user = await UserModel.findById(resetToken.userId);
            if (!user) {
                throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid or expired password reset token");
            }

            // The UserModel pre("save") hook re-hashes the password with argon2
            user.password = password;
            await user.save();

            // Single-use token: mark as consumed so it cannot be reused
            resetToken.usedAt = new Date();
            await resetToken.save();

            return { message: "Password reset successfully" };
        } catch (error) {
            throw error;
        }
    }

    private hashToken = (token: string): string => {
        return crypto.createHash("sha256").update(token).digest("hex");
    }
}

export default PasswordResetService;