interface IEnvConfig {
    port: number;
    nodeEnv: string;

    mongodbConnectionString: string;
    mongoDBConfig: {
        host: string;
        port: number;
        username: string;
        password: string;
        database: string;
    },
    superAdmin: {
        email: string;
        password: string;
    },
    // JWT Configuration
    jwtConfig: {
        accessTokenSecret: string;
        accessTokenMaxAgeMs: number;

        refreshTokenSecret: string;
        refreshTokenMaxAgeMs: number;
    },
    //Redis Configuration
    redis: {
        host: string;
        port: string;
        password: string;
    },
    //nodeMailer Configuration
    nodemailer: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPass: string;
        smtpSecure: boolean;
    },
    // Multer Configuration
    multer: {
        fileSizeLimit: number; // in bytes
        fileType: string;
    }
}


export default IEnvConfig;