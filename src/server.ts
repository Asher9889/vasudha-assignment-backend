import express from "express";

import envConfig from "./config/env.config";
import logger from "./config/logger";
import { connectMongoDB } from "./db";
import v1Routes from "./routes";
import { httpLogger } from "./middlewares";


connectMongoDB();

const app = express();
app.use(httpLogger);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.get("/", (req, res) => {
    res.send("Hello, World!");
});

app.use("/api", v1Routes);

app.listen(envConfig.port, () => {
    logger.info({ port: envConfig.port, env: envConfig.nodeEnv }, `Server is running.`);
});