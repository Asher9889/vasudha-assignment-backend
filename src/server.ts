import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import envConfig from "./config/env.config";
import logger from "./config/logger";
import { connectMongoDB } from "./db";
import v1Routes from "./routes";
import { httpLogger } from "./middlewares";
import { emailListener } from "./modules/email";
import { globalErrorHandler, routeNotExistsHandler } from "./utils";

connectMongoDB();

const app = express();

const allowedOrigins = ["http://localhost:5173", ]; 

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    logger.info(`Incoming request from origin: ${origin}`);
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin); // echo the origin
    }
    logger.error(`Blocked request from origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

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