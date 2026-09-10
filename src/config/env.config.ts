import IEnvConfig from "./types";
import { StringValue } from "ms";
import { parseStringDurationToMs } from "../utils";

const envConfig: IEnvConfig = {
    port: Number(process.env.PORT),
    nodeEnv: process.env.NODE_ENV!,

    // MongoDB Configuration
    mongodbConnectionString: process.env.MONGODB_URL!,
    mongoDBConfig: {
        host: process.env.DB_HOST!,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
    },

    // Super Admin Configuration
    superAdmin: {
        email: process.env.SUPER_ADMIN_EMAIL!,
        password: process.env.SUPER_ADMIN_PASSWORD!,
    },

    // JWT Configuration
    jwtConfig: {
        accessTokenSecret: process.env.JWT_ACCESS_TOKEN_SECRET!,
        accessTokenMaxAgeMs: parseStringDurationToMs(process.env.JWT_ACCESS_TOKEN_MAX_AGE as StringValue, "JWT_ACCESS_TOKEN_MAX_AGE"),

        refreshTokenSecret: process.env.JWT_REFRESH_TOKEN_SECRET!,
        refreshTokenMaxAgeMs: parseStringDurationToMs(process.env.JWT_REFRESH_TOKEN_MAX_AGE as StringValue, "JWT_REFRESH_TOKEN_MAX_AGE"),
    },
    //Redis
    redis: {
        host: process.env.REDIS_SERVER_HOST!,
        port: process.env.REDIS_SERVER_PORT!,
        password: process.env.REDIS_SERVER_PASSWORD!,
    },

    //nodeMailer

    nodemailer: {
        smtpHost: process.env.SMTP_HOST!,
        smtpPort: Number(process.env.SMTP_PORT!),
        smtpUser: process.env.SMTP_USER!,
        smtpPass: process.env.SMTP_PASS!,
        smtpSecure: process.env.SMTP_SECURE === "true"
    },
    // Multer Configuration
    multer: {
        fileSizeLimit: Number(process.env.MULTER_FILE_SIZE_LIMIT) * 1024 * 1024, // Convert MB to bytes
        fileType: process.env.MULTER_FILE_TYPE!,
    }

}

export default envConfig;