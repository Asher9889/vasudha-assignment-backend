import mongoose from "mongoose";
import { USER_ROLE } from "./auth.constants";

export const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(USER_ROLE), required: true }
}, { timestamps: true, versionKey: false });

userSchema.index({ email: 1 }, { unique: true });

const UserModel = mongoose.model("User", userSchema, "users");
 
export default UserModel;