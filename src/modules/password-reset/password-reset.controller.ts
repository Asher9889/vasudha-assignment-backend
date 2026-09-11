import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ApiResponse } from "../../utils";
import PasswordResetService from "./password-reset.service";
import { TForgotPasswordRequestDTO, TResetPasswordRequestDTO } from "./password-reset.types";

class PasswordResetController {
    private readonly passwordResetService: PasswordResetService;

    constructor(passwordResetService: PasswordResetService) {
        this.passwordResetService = passwordResetService;
    }

    forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = req.validatedBody as TForgotPasswordRequestDTO;
            await this.passwordResetService.forgotPassword({ email });

            return ApiResponse.success(res, StatusCodes.OK, "If an account exists for this email, a password reset link has been sent.");
        } catch (error) {
            return next(error);
        }
    }

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, password } = req.validatedBody as TResetPasswordRequestDTO;
            const result = await this.passwordResetService.resetPassword({ token, password });

            return ApiResponse.success(res, StatusCodes.OK, "Password reset successfully", result);
        } catch (error) {
            return next(error);
        }
    }
}

export default PasswordResetController;