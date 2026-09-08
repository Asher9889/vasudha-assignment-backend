import nodemailer from "nodemailer";
import envConfig from "./env.config";

const nodeMailerTransporter = nodemailer.createTransport({
    host: envConfig.nodemailer.smtpHost,
    port: Number(envConfig.nodemailer.smtpPort),
    secure: envConfig.nodemailer.smtpSecure, // true for 465, false for other ports
    auth: {
        user: envConfig.nodemailer.smtpUser,
        pass: envConfig.nodemailer.smtpPass
    }
});

export default nodeMailerTransporter;