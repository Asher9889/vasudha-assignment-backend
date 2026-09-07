import IEnvConfig from "./types";

const envConfig:IEnvConfig = {
    port: Number(process.env.PORT),
    nodeEnv: process.env.NODE_ENV!,
}

export default envConfig;