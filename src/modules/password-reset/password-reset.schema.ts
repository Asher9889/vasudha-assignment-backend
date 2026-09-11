import z from "zod";

const forgotPasswordSchema = z.object({
    email: z.email({ message: "Invalid email address" }),
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, { message: "Reset token is required" }),
    password: z.string()
        .min(6, { message: "Password must be at least 6 characters long" })
        .max(20, { message: "Password must be at most 20 characters long" }),
});

export { forgotPasswordSchema, resetPasswordSchema };