/************************************************************************************
 *   index.ts                                                                        *
 *                                                                                   *
 *   this program will subscribe to topics in MQTT broker and write into database    *
 *                                                                                   *
 ************************************************************************************/

// import statements
import * as mqtt from "mqtt";
import { Configuration } from "./config";
import pg from "pg";
import { logger } from "./logger";

// global variables
var config: any;
let configFileName: string = Configuration.setConfigurationFilename("config.json");
let tagsFileName: string = Configuration.setConfigurationFilename("tags.txt");

/*
 *   function main();
 *
 *   This is the mainline code for our project. This code will
 *   perform the following work:
 *   Create a client for MQTT and connect to broker
 *   Create a client for postgreSQL and connect to db
 *   Verify tables exists, create them otherwise
 *
 *   Subscribe to selected topic
 *   Write subscribed values to db
 *
 */

async function main() {
    logger.info("Starting code");

    // read config in runtime
    config = Configuration.readFileAsJSON(configFileName);

    // read tags from taglist
    let tags: string[] = Configuration.readFileAsArray(tagsFileName);

    // build MQTT base topic
    config.mqtt.baseTopic =
        config.mqtt.organization +
        "/" +
        config.mqtt.division +
        "/" +
        config.mqtt.plant +
        "/" +
        config.mqtt.area +
        "/" +
        config.mqtt.line +
        "/" +
        config.mqtt.workstation +
        "/" +
        config.mqtt.type;

    // create MQTT topic variable
    let subscribeTopic: string = config.mqtt.baseTopic;

    try {
        // make a connection to DB
        const dbClient = new pg.Client(config.sql_config); // change to sql_config for prod, sql_config_local for test
        logger.info("db client created");

        await dbClient.connect();
        logger.info("db connected");

        // create tables if not existing
        createTables(dbClient);

        // make a connetion to MQTT broker
        let url: string = config.mqtt.brokerUrl + ":" + config.mqtt.mqttPort;
        logger.info(`URL: ${url}`);
        const mqttClient: mqtt.MqttClient = await mqtt.connectAsync(url);
        logger.info("mqtt connected!");

        // local topic
        subscribeTopic =
            config.mqtt.organization +
            "/" +
            config.mqtt.division +
            "/" +
            config.mqtt.plant +
            "/" +
            config.mqtt.area +
            "/" +
            config.mqtt.line +
            "/#";
        await mqttClient.subscribeAsync(subscribeTopic);
        logger.info(`subscription established on topic: ${subscribeTopic}`);

        // set up subscription to MQTT topic
        mqttClient.on("message", (subscribeTopic, message) => {
            processMessageRecieved(subscribeTopic, message, dbClient);
        });

        // set up asynchronus disconnection support via signals
        const shutdown = async () => {
            logger.info("Disconnecting our services now");
            await mqttClient.endAsync();
            await dbClient.end();
            process.exit();
        };

        // set handlers
        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error) {
        let message: any;
        if (error instanceof Error) {
            message = error.message;
        } else message = "Unknown error";
        logger.error(message);
    }
}

/************************************************************************************
 *   processMessageRecieved(t:string, m:Buffer, dbc:pg.Client)                       *
 *                                                                                   *
 *   take recieved message and write to correct db table                             *
 *                                                                                   *
 ************************************************************************************/
async function processMessageRecieved(t: string, m: Buffer, dbc: pg.Client) {
    // split payload from MQTT
    let payload = JSON.parse(m.toString());
    let topicComponents: string[] = t.split(`/`);
    let variableComponent: string = topicComponents[7].split(`.`).slice(-1).toString().toLowerCase();

    // define variables
    let query: string = "";
    let deviceid: string = "Robot1";

    if (topicComponents.slice(-1).toString().includes("POS")) {
        // create position query
        query = `INSERT INTO position(timestamp, deviceid, ${variableComponent}) VALUES('${payload.timestamp}', '${deviceid}', ${payload.value}) ON CONFLICT(timestamp) DO UPDATE SET ${variableComponent} = ${payload.value};`;
    } else if (topicComponents[7].toString().includes("TORQUE")) {
        // create torque query
        query = `INSERT INTO torque(timestamp, deviceid, motors, motor1, motor2, motor3, motor4) VALUES('${payload.timestamp}', '${deviceid}', ARRAY[${payload.value}], ${payload.value[0]}, ${payload.value[1]}, ${payload.value[2]}, ${payload.value[3]});`;
    } else {
        // create status query
        query = `INSERT INTO status(timestamp, deviceid, ${variableComponent}) VALUES('${payload.timestamp}', '${deviceid}', ${payload.value}) ON CONFLICT(timestamp) DO UPDATE SET ${variableComponent} = ${payload.value};`;
    }
    // troubleshooting query
    //logger.info("query:", query);

    try {
        // try to write query to db
        await dbc.query(query);
    } catch (error) {
        // error handling
        let message: any;
        if (error instanceof Error) {
            message = error.message;
        } else message = "Unknown error";
        logger.error(message);
    }
}

/************************************************************************************
 *   createTables(dbc:pg.Client)                                                     *
 *                                                                                   *
 *   create db tables if not existing                                                *
 *                                                                                   *
 ************************************************************************************/
async function createTables(dbc: pg.Client) {
    // define local variables
    let statusQuery: string = "";
    let positionQuery: string = "";
    let torqueQuery: string = "";
    let query: string[] = ["", "", ""];

    // create query for status table
    statusQuery = `CREATE TABLE IF NOT EXISTS status (
            timestamp TIMESTAMP NOT NULL,
            deviceid VARCHAR(10) NOT NULL,
            initialized boolean,
            running boolean,
            merror boolean,
            wsviolation boolean,
            paused boolean,
            speedpercentage integer,
            finishedpartnum integer,
            PRIMARY KEY (timestamp),
            UNIQUE (timestamp)
            )`;
    // troubleshooting statusQuery
    //logger.info("status query: ", statusQuery);

    // create query for position table
    positionQuery = `CREATE TABLE IF NOT EXISTS position (
        timestamp TIMESTAMP NOT NULL,
        deviceid VARCHAR(10) NOT NULL,
        x double precision,
        y double precision,
        z double precision,
        PRIMARY KEY (timestamp),
        UNIQUE (timestamp)
        )`;
    // troubleshooting positionQuery
    //logger.info("position query: ", positionQuery);

    // create query for torque table
    torqueQuery = `CREATE TABLE IF NOT EXISTS torque (
        timestamp TIMESTAMP NOT NULL,
        deviceid VARCHAR(10) NOT NULL,
        motor1 double precision,
        motor2 double precision,
        motor3 double precision,
        motor4 double precision,
        motors double precision[],
        PRIMARY KEY (timestamp),
        UNIQUE (timestamp)
        )`;
    // troubleshooting torqueQuery
    //logger.info("torque query: ", torqueQuery);

    query = [statusQuery, positionQuery, torqueQuery];
    for (let i: number = 0; i < query.length; i++) {
        try {
            // try to write query to db
            await dbc.query(query[i]);
        } catch (error) {
            // error handling
            let message: any;
            if (error instanceof Error) {
                message = error.message;
            } else message = "Unknown error";
            logger.error(message);
        }
    }
}

main(); // Execute main function
