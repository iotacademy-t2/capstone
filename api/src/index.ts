/*
 * index.ts
 *
 * Demonstrate writing an express.js REST API
 */

import express, { Request, Response, NextFunction } from "express";
import pg from "pg";
import { Configuration } from "./config";
import { logger } from "./logger";
import { Helper } from "./helper";

let configFileName: string = Configuration.setConfigurationFilename("config.json");
var config = Configuration.readFileAsJSON(configFileName);

// get ENV variables
const PORT: number = Helper.convertDataToInteger(process.env.PORT, 3000);
config.sql_config.user = process.env.USER;
config.sql_config.password = process.env.PASSWORD;

const app: express.Application = express();

// middleware for logging purposes
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method}: ${req.path}`);
    next();
});

// home route using the app object
app.get("/", (req: Request, res: Response) => {
    res.send("<h3>Please use the '/device' endpoint for all API requests.</h3>");
});

app.use(express.static("static"));

// the API router for our test API
const apiRouter = express.Router();

// middleware specific to this api router
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
    next();
});

// device endpoint
apiRouter.get("/device", async (req: Request, res: Response) => {
    let ip: any = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    logger.info(`new request from ${ip}`);

    let query = Helper.createQuery(req.query.limit, req.query.start, req.query.end, req.query.metric);

    try {
        const dbclient = new pg.Client(config.sql_config);
        await dbclient.connect();
        let result: any = await dbclient.query(query);
        res.json(result["rows"]);
        await dbclient.end();
    } catch (error) {
        let message: any;
        if (error instanceof Error) {
            message = error.message;
        } else message = "Unknown error";
        logger.error(message);
        res.send(`<h3>ERROR retrieving data</h3>${message}`);
    }
});

app.use(apiRouter);

// start the server
app.listen(PORT, () => {
    logger.info(`Server started listening on port ${PORT}`);
});
