/*
 *   index.ts
 *   this source file will implement connection to PLC, reading tags through polling
 *   publishing to MQTT with configured topic
 *
 */

// import statements
import * as ads from "ads-client";
import * as mqtt from "mqtt";
import { Configuration } from "./config";
import { logger } from "./logger";

// global variables
var config: any;
let configFileName: string = Configuration.setConfigurationFilename("config.json");
let tagsFileName: string = Configuration.setConfigurationFilename("tags.txt");
let statustagsFileName: string = Configuration.setConfigurationFilename("statustags.txt");

/*************************************************************************************
 *   Main ()                                                                         *
 *                                                                                   *
 *   this program will read PLC tags and publish to the MQTT broker                  *
 *                                                                                   *
 ************************************************************************************/
async function main() {
    logger.info("Starting code");

    // read config in runtime
    config = Configuration.readFileAsJSON(configFileName);

    // read tags from taglist
    let tags: string[] = Configuration.readFileAsArray(tagsFileName);
    let statustags: string[] = Configuration.readFileAsArray(statustagsFileName);

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

    try {
        // make a connection to the Beckhoff platform
        const adsclient = new ads.Client(config.ads);
        await adsclient.connect();

        // make a connetion to MQTT broker
        let url: string = config.mqtt.brokerUrl + ":" + config.mqtt.mqttPort;
        logger.info(`URL: ${url}`);
        const mqttclient: mqtt.MqttClient = await mqtt.connectAsync(url);
        logger.info("mqtt connected!");

        // call processReadRequest function
        setInterval(processReadRequest, 1000, adsclient, tags, mqttclient);

        // set up asynchronus disconnection support via signals
        const shutdown = async () => {
            logger.info("Disconnecting our services now");
            await adsclient.disconnect();
            await mqttclient.endAsync();
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
 *   processReadRequest (adsclient: ads.Client, tags:string[])                       *
 *                                                                                   *
 *   this function will process all ADS reads to PLC tags in the tags array          *
 *                                                                                   *
 ************************************************************************************/
async function processReadRequest(adsclient: ads.Client, tags: string[], mqttclient: mqtt.MqttClient) {
    // set up local variables
    let data: ads.SymbolData;

    // one common timestamp for all of the readings we're doing
    let timestamp: Date = new Date();

    try {
        // iterate through all tags
        for (let index: number = 0; index < tags.length; index++) {
            // read PLC tag and output
            data = await adsclient.readSymbol(tags[index]);
            logger.info(`data for tag: ${tags[index]} is: ${data.value}`);

            // MQTT payload and topic processing
            let topic: string = config.mqtt.baseTopic + "/" + tags[index];
            let payload = {
                timestamp: timestamp.toISOString(),
                value: data.value,
            };

            // Connect to MQTT broker and output
            await mqttclient.publishAsync(topic, JSON.stringify(payload));
            logger.info(`published: ${topic} with payload: ${JSON.stringify(payload)}`);
        }
    } catch (error) {
        let message: any;
        if (error instanceof Error) {
            message = error.message;
        } else message = "Unknown error";
        logger.error(message);
    }
}

main(); // Execute main function
