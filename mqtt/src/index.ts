/************************************************************************************
*   index.ts                                                                        *
*                                                                                   *
*   this program will subscribe to topics in MQTT broker and write into database    *
*                                                                                   *
************************************************************************************/

// import statements
import * as mqtt from 'mqtt';
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
*   Create a client for MQTT and connect to broker
*   Create a client for postgreSQL and connect to db
*
*   Subscribe to selected topic
*   Write subscribed values to db
*
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
            });

            // set up asynchronus disconnection support via signals
            const shutdown = async() => {
                console.log("Disconnecting our services now");
                await mqttClient.endAsync();
                await dbClient.end();
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
*   take recieved message and write to correct db table                             *
*                                                                                   *
************************************************************************************/
async function processMessageRecieved(t:string, m:Buffer, dbc:pg.Client)
{
    // split payload from MQTT
    let payload = JSON.parse(m.toString());
    let topicComponents:string[] = t.split(`/`);
    let variableComponent:string = topicComponents[7].split(`.`).slice(-1).toString().toLowerCase();

    // define variables
    let query:string = "";
    let deviceid:string = "Robot1";

    if (topicComponents.slice(-1).toString().includes('POS')) {
        // create position query
        query = `INSERT INTO position(timestamp, deviceid, ${variableComponent}) VALUES('${payload.timestamp}', '${deviceid}', ${payload.value}) ON CONFLICT(timestamp) DO UPDATE SET ${variableComponent} = ${payload.value};`;
    } else if (topicComponents[7].toString().includes('TORQUE')) {
        // create torque query
        query = `INSERT INTO torque(timestamp, deviceid, motors, motor1, motor2, motor3, motor4) VALUES('${payload.timestamp}', '${deviceid}', ARRAY[${payload.value}], ${payload.value[0]}, ${payload.value[1]}, ${payload.value[2]}, ${payload.value[3]});`;
    } else {
        // create status query
        query = `INSERT INTO status(timestamp, deviceid, ${variableComponent}) VALUES('${payload.timestamp}', '${deviceid}', ${payload.value}) ON CONFLICT(timestamp) DO UPDATE SET ${variableComponent} = ${payload.value};`;
    }
    // troubleshooting query
    //console.log("query:", query);

    try {
        // try to write query to db
        await dbc.query(query);
    } catch (error) {
        // error handling
        let message: any;
        if (error instanceof Error) {
            message = error.message;
        } else message = "Unknown error";
        console.error((new Date().toISOString()), message);
    }
}

main();     // Execute main function