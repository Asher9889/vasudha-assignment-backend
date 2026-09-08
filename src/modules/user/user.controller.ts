import { Request, Response, NextFunction } from "express";
import UserService from "./user.service";
import { TCreateUserPayload } from "./user.types";
import { ApiResponse } from "../../utils";
import { StatusCodes } from "http-status-codes";

class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }


    createUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = req.validatedBody as TCreateUserPayload;
            const data = await this.userService.createUser(body);
            return ApiResponse.success(res, StatusCodes.CREATED, "User created successfully", data);
        } catch (error) {
            next(error);
        }
    }
}

export default UserController;