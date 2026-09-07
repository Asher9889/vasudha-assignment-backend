import IEnvConfig from "./types";

const envConfig:IEnvConfig = {
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

    superAdmin: {
        email: process.env.SUPER_ADMIN_EMAIL!,
        password: process.env.SUPER_ADMIN_PASSWORD!,
    },

}

export default envConfig;