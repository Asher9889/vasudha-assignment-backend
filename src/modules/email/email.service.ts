import { Transporter } from "nodemailer";
import { TCreateUserPayload } from "../user";
import { TResetPasswordLinkPayload } from "../password-reset";
import userCreatedEmailTemplate from "./templates/user-created.template";
import passwordResetEmailTemplate from "./templates/password-reset.template";


class EmailService {
    private readonly transport: Transporter;

    constructor(transport: Transporter) {
        this.transport = transport;
    }

    sendUserCreatedEmail = async (user: TCreateUserPayload) => {
        try {
            await this.transport.sendMail({
                from: '"Saurabh Kushwaha" <contact@saurabhkushwaha.in>', // sender address
                to: user.email, // list of recipients
                subject: "Welcome to Vasudha Foundation", // subject line
                html: userCreatedEmailTemplate(user), // HTML body  
            })
        } catch (error) {
            console.error("Error sending welcome email:", error);
        }

    }

    sendPasswordResetEmail = async (payload: TResetPasswordLinkPayload) => {
        try {
            await this.transport.sendMail({
                from: '"Saurabh Kushwaha" <contact@saurabhkushwaha.in>',
                to: payload.email,
                subject: "Password Reset Link - Vasudha Foundation",
                html: passwordResetEmailTemplate(payload),
            })
        } catch (error) {
            console.error("Error sending password reset email:", error);
        }
    }
}

export default EmailService;