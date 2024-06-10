/************************************************************************************
*   index.ts                                                                        *
*                                                                                   *
*   this program will subscribe to topics in MQTT broker                            *
*                                                                                   *
************************************************************************************/

// import statements
import * as fs from 'fs';
import * as mqtt from 'mqtt';
import * as path from 'path';
import { Configuration } from './config';
import pg from 'pg';

// global variables
var config:any;
let configFileName:string = Configuration.setConfigurationFilename("config.json");
let tagsFileName:string = Configuration.setConfigurationFilename("tags.txt");

/*
*   function main();
*
*   This is the mainline code for our project. This code will
*   perform the following work:
*   TODO: Add in description
*/

async function main() {

    console.log("Starting code");

    // read config in runtime
    config = Configuration.readFileAsJSON(configFileName);

    // read tags from taglist
    let tags:string[] = Configuration.readFileAsArray(tagsFileName);

    // build MQTT base topic
    config.mqtt.baseTopic = config.mqtt.organization + "/" + config.mqtt.division + "/" + config.mqtt.plant + "/" + config.mqtt.area
                                + "/" + config.mqtt.line + "/" + config.mqtt.workstation + "/" + config.mqtt.type;

    // create MQTT topic variable
    let subscribeTopic:string = config.mqtt.baseTopic;

    try
    {

            // make a connection to DB
            const dbClient = new pg.Client(config.sql_config_local);    // change to sql_config for prod
            console.log("db client created");

            await dbClient.connect();
            console.log("db connected");

            // make a connetion to MQTT broker
            let url:string = config.mqtt.brokerUrl + ":" + config.mqtt.mqttPort;
            console.log("URL: ", url);
            const mqttClient:mqtt.MqttClient = await mqtt.connectAsync(url);
            console.log("mqtt connected!");

            // local topic
            subscribeTopic = "magna/iotacademy/conestoga/smart/presorter/#";
            await mqttClient.subscribeAsync(subscribeTopic);
            console.log("subscription established on topic:" , subscribeTopic);

            // set up subscription to MQTT topic
            mqttClient.on('message', (subscribeTopic, message) => {
                processMessageRecieved(subscribeTopic, message, dbClient);
                //console.log(`Recv: ${message.toString()} on topic: ${subscribeTopic}`);
                // TODO: add in additional processing for the recieved message

            });

            // set up asynchronus disconnection support via signals
            const shutdown = async() => {
                console.log("Disconnecting our services now");
                await mqttClient.endAsync();
                await dbClient.end();
                // TODO: Add in other requests to disconnect from services
                process.exit();
            }

            // set handlers
            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);

        }  catch (error) {
            let message: any;
            if (error instanceof Error) {
                message = error.message;
            } else message = "Unknown error";
            console.error((new Date().toISOString()), message);
        }

}


/************************************************************************************
*   processMessageRecieved(t:string, m:Buffer, dbc:pg.Client)                       *
*                                                                                   *
*   do something with recieved message                                              *
*                                                                                   *
*                                                                                   *
************************************************************************************/
async function processMessageRecieved(t:string, m:Buffer, dbc:pg.Client)
{
    // split payload from MQTT
    let payload = JSON.parse(m.toString());
    let topicComponents:string[] = t.split(`/`);
    let variableComponents:string[] = topicComponents[7].split(`.`);

    // define variables
    let query:string = "";
    let deviceid:string = "Robot1";

    if (topicComponents.slice(-1).includes('POS')) {

        query = `INSERT INTO position(TS, deviceid, position.${variableComponents.slice(-1)})
                    VALUES(${payload.timestamp}, ${deviceid}, ${payload.value}) ON CONFLICT(TS)`;

    } else if (topicComponents[7].includes('TORQUE')) {
        query = "";// push torque data
    } else {
        query = `INSERT INTO position(TS, deviceid, position.${variableComponents.slice(-1)}) VALUES(${payload.timestamp}, ${deviceid}, ${payload.value}) ON CONFLICT(TS)`;
        // push status data
    }

    // execute query
    // debug info
    //console.log(topicComponents);

    //rawdata = `"${payload.timestamp}","${topicComponents[0]}","${topicComponents[1]}","${topicComponents[2]}","${topicComponents[3]}",
    //            "${topicComponents[4]}","${topicComponents[5]}","${topicComponents[6]}","${topicComponents[7]}","${payload.value}\n`;

    //console.log("parsed data: ", rawdata);
    //console.log(`Recv: ${m.toString()} on topic: ${t}`);
}

main();     // Execute main function