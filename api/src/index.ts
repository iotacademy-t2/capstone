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

const PORT: number = Helper.convertDataToInteger(process.env.PORT, 3000);

let configFileName: string = Configuration.setConfigurationFilename("config.json");
var config = Configuration.readFileAsJSON(configFileName);

const app: express.Application = express();

// middleware for logging purposes
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method}: ${req.path}`);
    next();
});

// home route using the app object
app.get("/", (req: Request, res: Response) => {
    res.send("<h3>Please use the '/api' endpoint for all requests.</h3>");
});

// the API router for our test API
const apiRouter = express.Router();

// middleware specific to this api router
apiRouter.use((req: Request, res: Response, next: NextFunction) => {
    next();
});

apiRouter.get("/device", async (req: Request, res: Response) => {
    let ip: any = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    logger.info(`new request from ${ip}`);

    let query = Helper.createQuery(
        req.query.limit,
        req.query.start,
        req.query.end,
        req.query.metric
    );

    res.send(query);

    /* try {
        const dbclient = new pg.Client(config.sql_config);
        logger.info("database client created");
        await dbclient.connect();
        let result: any = await dbclient.query(query);
        let data: object = result["rows"];
        res.json(data);
        await dbclient.end();
        logger.info("database client destroyed");
    } catch (error) {
        res.send("Error parsing request");
        logger.error(error);
    } */
});

app.use(apiRouter);

// start the server
app.listen(PORT, () => {
    logger.info(`Server started listening on port ${PORT}`);
});

// http://127.0.0.1:3000/device?limit=10&start=2024-06-11T00:00:00.000Z&end=2024-06-11T23:59:00.000Z&metric=position
// SELECT * FROM telemetry WHERE timestamp > '2024-06-11T00:00:00.000Z' AND timestamp < '2024-06-11T23:59:00.000Z' AND metric NOT LIKE '%TORQUE%' AND metric NOT LIKE '%POS%' LIMIT 100;
