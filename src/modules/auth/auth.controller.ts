import { Request, Response, NextFunction, CookieOptions } from "express";
import AuthService from "./auth.service";
import { TLoginRequestDTO } from "./auth.types";
import { ApiResponse } from "../../utils";

class AuthController {
    private readonly authService: AuthService;
    private readonly cookieOptions: CookieOptions;
    
    constructor(authService: AuthService, cookieOptions: CookieOptions) {
        this.authService = authService;
        this.cookieOptions = cookieOptions;
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.validatedBody as TLoginRequestDTO;

    const tokens = await this.authService.login({email, password});

    res.cookie("accessToken", tokens.accessToken, this.cookieOptions);
    res.cookie("refreshToken", tokens.refreshToken, this.cookieOptions);
    
    return ApiResponse.success(res, 200, "Login successful");
  }
} 

export default AuthController;