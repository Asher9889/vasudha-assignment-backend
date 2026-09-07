import express from "express";
import envConfig from "./config/env.config";
import logger from "./config/logger";

const app = express();

app.get("/", (req, res) => {
    res.send("Hello, World!");
});

app.listen(envConfig.port, () => {
    logger.info({ port: envConfig.port, env: envConfig.nodeEnv },`Server is running.`); 
});