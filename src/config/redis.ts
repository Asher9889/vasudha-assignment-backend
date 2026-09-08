import Redis from "ioredis";
import envConfig from "./env.config";
import { logger } from "../config";


const redisConnectionOptions = {
    host: envConfig.redis.host,
    port: Number(envConfig.redis.port),
    username: "default",
    password: envConfig.redis.password,
    db: 0,
    maxRetriesPerRequest: null, // BullMQ handles retries internally. if true redis will interfere with bullmq retry mechanism
    enableReadyCheck: true, // Enable ready check to ensure the connection is established
};

const redis = new Redis(redisConnectionOptions);

redis.on("connect", () => {
    logger.info("✅ Client connected to Redis Server");
});

redis.on("error", (err) => {
    logger.error("❌ Redis Error: " + err);
});


export default redis;
export { redisConnectionOptions };