import { Request, Response, NextFunction } from "express";
import UserService from "./user.service";

class UserController {
    private userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }


    createUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = req.validatedBody;
            await this.userService.createAdmin(body);
            return res.status(201).json({ message: "Admin created successfully" });
        } catch (error) {
            next(error);
        }
    }
}

export default UserController;