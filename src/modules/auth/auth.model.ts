import mongoose from "mongoose";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

import { USER_ROLE } from "./auth.constants";
import { envConfig } from "../../config";
import { TUserRole } from "./auth.types";


interface TAuthUser extends mongoose.Document {
    email: string;
    password: string;
    role: TUserRole;
    comparePassword(password: string): Promise<boolean>;
    generateTokens(data: {id: string, role: string}): { accessToken: string, refreshToken: string };
}

export const authSchema = new mongoose.Schema<TAuthUser>({
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(USER_ROLE), required: true }
}, { timestamps: true, versionKey: false });

authSchema.index({ email: 1 }, { unique: true });

authSchema.methods.comparePassword = async function (password: string) {
    return await argon2.verify(this.password, password);
}

authSchema.methods.generateTokens = function(data: {id: string, role: string}){
    const accessToken = jwt.sign(data, envConfig.jwtConfig.accessTokenSecret, { expiresIn: envConfig.jwtConfig.accessTokenMaxAgeMs });
    const refreshToken = jwt.sign(data, envConfig.jwtConfig.refreshTokenSecret, { expiresIn: envConfig.jwtConfig.refreshTokenMaxAgeMs });
    return { accessToken, refreshToken }; 
}


const AuthModel = mongoose.model<TAuthUser>("Auth", authSchema, "users");

export default AuthModel;