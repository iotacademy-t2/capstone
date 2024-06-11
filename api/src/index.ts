/*
 * index.ts
 *
 * Demonstrate writing an express.js REST API
 */

import express, { Request, Response, NextFunction } from "express";
import pg from "pg";
import { logger } from "./logger";
import { Helper } from "./helper";

const PORT: number = 3000;

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
