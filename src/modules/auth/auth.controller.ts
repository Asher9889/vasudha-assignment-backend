import { Request, Response, NextFunction, CookieOptions } from "express";
import AuthService from "./auth.service";
import { TLoginRequestDTO } from "./auth.types";
import { ApiResponse } from "../../utils";
import { StatusCodes } from "http-status-codes";

class AuthController {
    private readonly authService: AuthService;
    private readonly cookieOptions: CookieOptions;

    constructor(authService: AuthService, cookieOptions: CookieOptions) {
        this.authService = authService;
        this.cookieOptions = cookieOptions;
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.validatedBody as TLoginRequestDTO;

            const tokens = await this.authService.login({ email, password });

            res.cookie("accessToken", tokens.accessToken, this.cookieOptions);
            res.cookie("refreshToken", tokens.refreshToken, this.cookieOptions);

            return ApiResponse.success(res, StatusCodes.OK, "Login successful");
        } catch (error) {
            next(error);
        }

    }

     refresh = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                return ApiResponse.error(res, StatusCodes.BAD_REQUEST, "Unauthorized", StatusCodes.UNAUTHORIZED);
            }
            const { tokens } = await this.authService.refresh(refreshToken);

            res.cookie("accessToken", tokens.accessToken, this.cookieOptions);
            res.cookie("refreshToken", tokens.refreshToken, this.cookieOptions);
            return ApiResponse.success(res, StatusCodes.OK, "Both tokens updated successfully");
        } catch (error) {
            return next(error);
        }
    }

    getMe = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.validatedUser._id.toString();

            const user = await this.authService.getMe(id);
            return ApiResponse.success(res, StatusCodes.OK, "User fetched successfully", user);
        } catch (error) {
            return next(error);
        }
    }

}

export default AuthController;