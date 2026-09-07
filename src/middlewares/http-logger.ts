import pinoHttp from "pino-http";
import logger from "../config/logger";

const httpLogger = pinoHttp({
    logger,

    // serializers: {
    //     req: () => undefined,
    //     res: () => undefined,
    // },

    customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`;
    },

    customErrorMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`;
    },

    customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },
});

export default httpLogger;