/*
 * index.ts
 *
 * Demonstrate writing an express.js REST API
 */

import express, { Request, Response, NextFunction } from "express";
import pg from "pg";
import { Helper } from "./helper";

const PORT: number = 3000;

const app: express.Application = express();

// middleware for logging purposes
app.use((req: Request, res: Response, next: NextFunction) => {
    // TODO: insert winston logging
    console.log(`${req.method} ${req.path}`);
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
    console.log("API router specific middleware!");
    next();
});

apiRouter.get("/device", (req: Request, res: Response) => {
    res.send("Device endpoint");
});

apiRouter.get("/timestable/:table", (req: Request, res: Response) => {
    let ttable: number = Helper.convertDataToInteger(req.params.table, 1);
    let start: number = Helper.convertDataToInteger(req.query.start, 1);
    let end: number = Helper.convertDataToInteger(req.query.end, 10);
    if (start > end) {
        let t: number = start;
        start = end;
        end = t;
    }
    let tableoutput: string[] = Helper.generateTimesTable(ttable, start, end);
    res.json(tableoutput);
});

// use the router we just defined
app.use("/api", apiRouter);

// start the server (a port listener)
app.listen(PORT, () => {
    console.log(`Hello Seattle, I'm listening! (on port ${PORT})`);
});
