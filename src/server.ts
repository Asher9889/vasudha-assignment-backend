import express from "express";
import cookieParser from "cookie-parser";

import envConfig from "./config/env.config";
import logger from "./config/logger";
import { connectMongoDB } from "./db";
import v1Routes from "./routes";
import { httpLogger } from "./middlewares";
import { emailListener } from "./modules/email";
import { globalErrorHandler, routeNotExistsHandler } from "./utils";

connectMongoDB();

const app = express();

app.use(httpLogger);
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

emailListener.register(); // email event listener

app.get("/", (req, res) => {
    res.send("Hello, World!");
});

app.use("/api", v1Routes);


app.use(routeNotExistsHandler);

app.use(globalErrorHandler);


app.listen(envConfig.port, () => {
    logger.info({ port: envConfig.port, env: envConfig.nodeEnv }, `Server is running.`);
});