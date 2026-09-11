import crypto from "crypto";
import argon2 from "argon2";
import { StatusCodes } from "http-status-codes";
import { describe, expect, it, vi } from "vitest";
import { PASSWORD_RESET_EVENTS } from "./password-reset.constants";

vi.mock("../../config", () => ({
    envConfig: {
        frontendUrl: "http://localhost:5173",
        passwordReset: { tokenTTLMs: 600000 },
    },
    logger: { info: vi.fn(), error: vi.fn() },
}));

vi.mock("../../events", () => ({
    eventBus: { emit: vi.fn() },
}));

vi.mock("./password-reset.model", () => ({
    default: {
        findOne: vi.fn(),
        deleteMany: vi.fn(),
        create: vi.fn(),
    },
}));

vi.mock("../user", () => ({
    UserModel: {
        findOne: vi.fn(),
        findById: vi.fn(),
    },
}));

import { eventBus } from "../../events";
import { UserModel } from "../user";
import PasswordResetTokenModel from "./password-reset.model";
import PasswordResetService from "./password-reset.service";

const service = new PasswordResetService();

const sha256 = (token: string) => crypto.createHash("sha256").update(token).digest("hex");
const randomToken = () => crypto.randomBytes(32).toString("hex");

const GENERIC_FORGOT_MESSAGE = "If an account exists for this email, a password reset link has been sent.";
const GENERIC_RESET_ERROR = "Invalid or expired password reset token";

describe("PasswordResetService.forgotPassword", () => {
    it("invalidates old active tokens, stores only the token hash, and emits a reset event when the email exists", async () => {
        const userId = "507f1f77bcf86cd799439011";
        const email = "admin@example.com";

        (UserModel.findOne as any).mockResolvedValue({ _id: userId, email });

        let createdDoc: any;
        (PasswordResetTokenModel.create as any).mockImplementation(async (doc: any) => {
            createdDoc = doc;
            return doc;
        });

        const result = await service.forgotPassword({ email });

        expect(result.message).toBe(GENERIC_FORGOT_MESSAGE);
        expect(UserModel.findOne).toHaveBeenCalledWith({ email });
        expect(PasswordResetTokenModel.deleteMany).toHaveBeenCalledWith({ userId, usedAt: null });
        expect(PasswordResetTokenModel.create).toHaveBeenCalledTimes(1);

        expect(createdDoc.userId).toBe(userId);
        expect(createdDoc.usedAt).toBeNull();
        expect(createdDoc.expiresAt).toBeInstanceOf(Date);
        expect(createdDoc.tokenHash).toMatch(/^[0-9a-f]{64}$/);

        expect(eventBus.emit).toHaveBeenCalledTimes(1);
        const [eventName, payload] = (eventBus.emit as any).mock.calls[0];
        expect(eventName).toBe(PASSWORD_RESET_EVENTS.REQUESTED);
        expect(payload.email).toBe(email);
        expect(payload.resetUrl).toMatch(/^http:\/\/localhost:5173\/reset-password\?token=/);

        // Raw token is never persisted — only its SHA-256 hash is
        const rawToken = payload.resetUrl.split("token=")[1];
        expect(createdDoc.tokenHash).not.toBe(rawToken);
        expect(createdDoc.tokenHash).toBe(sha256(rawToken));
    });

    it("returns the exact same generic response and performs no work when the email does not exist", async () => {
        (UserModel.findOne as any).mockResolvedValue(null);

        const result = await service.forgotPassword({ email: "nobody@example.com" });

        expect(result.message).toBe(GENERIC_FORGOT_MESSAGE);
        expect(PasswordResetTokenModel.deleteMany).not.toHaveBeenCalled();
        expect(PasswordResetTokenModel.create).not.toHaveBeenCalled();
        expect(eventBus.emit).not.toHaveBeenCalled();
    });
});

describe("PasswordResetService.resetPassword", () => {
    it("hashes the received token consistently, resets the password via the argon2 hook, and marks the token as used", async () => {
        const token = randomToken();
        const userId = "507f1f77bcf86cd799439022";
        const newPassword = "newPassword123";

        const resetTokenDoc: any = {
            userId,
            usedAt: null,
            expiresAt: new Date(Date.now() + 600_000),
            save: vi.fn(async function (this: any) {
                this.usedAt = new Date();
            }),
        };
        (PasswordResetTokenModel.findOne as any).mockResolvedValue(resetTokenDoc);

        const savedUser: any = {
            _id: userId,
            password: undefined,
            save: vi.fn(async function (this: any) {
                // Mimics the real UserModel pre("save") argon2 hook
                this.password = await argon2.hash(this.password);
            }),
        };
        (UserModel.findById as any).mockResolvedValue(savedUser);

        const result = await service.resetPassword({ token, password: newPassword });

        expect(result.message).toBe("Password reset successfully");
        expect(PasswordResetTokenModel.findOne).toHaveBeenCalledWith({ tokenHash: sha256(token) });
        expect(UserModel.findById).toHaveBeenCalledWith(userId);

        // New password is stored hashed by the model hook, never in plaintext
        expect(savedUser.password).not.toBe(newPassword);
        expect(await argon2.verify(savedUser.password, newPassword)).toBe(true);
        expect(savedUser.save).toHaveBeenCalledTimes(1);

        // Token is marked as used so it cannot be reused
        expect(resetTokenDoc.usedAt).toBeInstanceOf(Date);
        expect(resetTokenDoc.save).toHaveBeenCalledTimes(1);
    });

    it("rejects with a generic 400 error when the token is expired", async () => {
        const token = randomToken();

        (PasswordResetTokenModel.findOne as any).mockResolvedValue({
            userId: "507f1f77bcf86cd799439022",
            usedAt: null,
            expiresAt: new Date(Date.now() - 60_000),
            save: vi.fn(),
        });

        await expect(service.resetPassword({ token, password: "newPassword123" }))
            .rejects.toMatchObject({ statusCode: StatusCodes.BAD_REQUEST, message: GENERIC_RESET_ERROR });
        expect(UserModel.findById).not.toHaveBeenCalled();
    });

    it("rejects with a generic 400 error when the token does not exist", async () => {
        (PasswordResetTokenModel.findOne as any).mockResolvedValue(null);

        await expect(service.resetPassword({ token: "non-existent-token", password: "newPassword123" }))
            .rejects.toMatchObject({ statusCode: StatusCodes.BAD_REQUEST, message: GENERIC_RESET_ERROR });
        expect(UserModel.findById).not.toHaveBeenCalled();
    });

    it("rejects with a generic 400 error when the token has already been used", async () => {
        const token = randomToken();

        (PasswordResetTokenModel.findOne as any).mockResolvedValue({
            userId: "507f1f77bcf86cd799439022",
            usedAt: new Date(),
            expiresAt: new Date(Date.now() + 600_000),
            save: vi.fn(),
        });

        await expect(service.resetPassword({ token, password: "newPassword123" }))
            .rejects.toMatchObject({ statusCode: StatusCodes.BAD_REQUEST, message: GENERIC_RESET_ERROR });
        expect(UserModel.findById).not.toHaveBeenCalled();
    });

    it("rejects with a generic 400 error when the user no longer exists", async () => {
        const token = randomToken();

        (PasswordResetTokenModel.findOne as any).mockResolvedValue({
            userId: "507f1f77bcf86cd799439022",
            usedAt: null,
            expiresAt: new Date(Date.now() + 600_000),
            save: vi.fn(),
        });
        (UserModel.findById as any).mockResolvedValue(null);

        await expect(service.resetPassword({ token, password: "newPassword123" }))
            .rejects.toMatchObject({ statusCode: StatusCodes.BAD_REQUEST, message: GENERIC_RESET_ERROR });
    });

    it("cannot be reused: after a successful reset the same token is rejected on a second attempt", async () => {
        const token = randomToken();
        const userId = "507f1f77bcf86cd799439023";

        let usedAt: Date | null = null;
        const resetTokenDoc: any = {
            get userId() { return userId; },
            get usedAt() { return usedAt; },
            set usedAt(v: Date | null) { usedAt = v; },
            expiresAt: new Date(Date.now() + 600_000),
            save: vi.fn(async function (this: any) {
                usedAt = new Date();
            }),
        };

        (PasswordResetTokenModel.findOne as any).mockResolvedValue(resetTokenDoc);
        (UserModel.findById as any).mockResolvedValue({
            _id: userId,
            password: "",
            save: vi.fn(async function (this: any) {
                this.password = await argon2.hash(this.password);
            }),
        });

        // First attempt succeeds; save() marks the token as used
        await service.resetPassword({ token, password: "brandNewPassword" });
        expect(usedAt).toBeInstanceOf(Date);

        // Second attempt with the same token must fail — usedAt is already set
        await expect(service.resetPassword({ token, password: "anotherPassword" }))
            .rejects.toMatchObject({ statusCode: StatusCodes.BAD_REQUEST, message: GENERIC_RESET_ERROR });
    });

    it("does not touch sessions (the existing auth architecture uses stateless JWTs)", async () => {
        const token = randomToken();

        (PasswordResetTokenModel.findOne as any).mockResolvedValue({
            userId: "507f1f77bcf86cd799439022",
            usedAt: null,
            expiresAt: new Date(Date.now() + 600_000),
            save: vi.fn(),
        });
        (UserModel.findById as any).mockResolvedValue({ _id: "507f1f77bcf86cd799439022", password: "", save: vi.fn() });

        await service.resetPassword({ token, password: "newPassword123" });

        expect(eventBus.emit).not.toHaveBeenCalled();
        expect(UserModel.findById).toHaveBeenCalledTimes(1);
    });
});