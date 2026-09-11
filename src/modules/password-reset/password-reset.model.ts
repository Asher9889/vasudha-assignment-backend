import mongoose from "mongoose";

export interface IPasswordResetToken extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
    usedAt: Date | null;
}

const passwordResetTokenSchema = new mongoose.Schema<IPasswordResetToken>({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

passwordResetTokenSchema.index({ tokenHash: 1 });
passwordResetTokenSchema.index({ userId: 1, usedAt: 1 });
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetTokenModel = mongoose.model<IPasswordResetToken>("PasswordResetToken", passwordResetTokenSchema, "password_reset_tokens");

export default PasswordResetTokenModel;