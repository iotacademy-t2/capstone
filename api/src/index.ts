/*
 * index.ts
 *
 * Demonstrate writing an express.js REST API
 */

import express, { Request, Response, NextFunction } from "express";
import pg from "pg";
import { createLogger, transports, format } from "winston";
import { Helper } from "./helper";

const PORT: number = 3000;

const logger = createLogger({
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.timestamp(),
                format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level}: ${message}`;
                })
            ),
        }),
        new transports.File({
            dirname: "../logs",
            filename: "api.log",
            format: format.combine(format.timestamp(), format.json()),
        }),
    ],
});

const app: express.Application = express();

// middleware for logging purposes
app.use((req: Request, res: Response, next: NextFunction) => {
    // TODO: insert winston logging
    logger.info(`${req.method} ${req.path}`);
    // continue default processing
    next();
});

// home route using the app object
app.get("/", (req: Request, res: Response) => {
    res.send("Welcome to our first Typescript REST API app!");
});

// the API router for our test API
const apiRouter = express.Router();

// middleware specific to this api router
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
    logger.info("API router specific middleware!");
    next();
});

apiRouter.get("/device", (req: Request, res: Response) => {
    res.send("Device endpoint");
});

app.use("/api", apiRouter);

// start the server (a port listener)
app.listen(PORT, () => {
    logger.info(`Server started listening on port ${PORT}`);
});