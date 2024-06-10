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
    let subscribeTopic:string = config.mqtt.subscribeTopic;
    
    try 
    {

            // set up connection to DB
            const dbClient = new pg.Client(config.sql_config);
            console.log("db client created");

            // make a connetion to MQTT broker
            let url:string = config.mqtt.brokerUrl + ":" + config.mqtt.mqttPort;
            console.log("URL: ", url);
            const mqttClient:mqtt.MqttClient = await mqtt.connectAsync(url);
            console.log("mqtt connected!");

            // local topic
            subscribeTopic = "magna/iotacademy/conestoga/smart/presorter/#";
            // set up subscription to MQTT topic
            mqttClient.on('message', (subscribeTopic, message) => {
                //processMessageRecieved(subscribeTopic, message);
                //console.log(`Recv: ${message.toString()} on topic: ${subscribeTopic}`);
                // TODO: add in additional processing for the recieved message

            });

            await mqttClient.subscribeAsync(subscribeTopic);
            console.log("subscription established");

            await dbClient.connect();
            console.log("db connected");
            // create table if not existing
            let sql_command:string = fs.readFileSync('./sql/setup_create.txt').toString();
            await dbClient.query(sql_command);
            console.log("db table created");

            // db testing
            let d:Date = new Date(Date.now());

            let ts:string = d.toISOString();
            let deviceid:string = "test_device";
            let metric:string = "PLCtag";
            let value:number = 555.55;

            sql_command =   "INSERT INTO telemetry(timestamp, deviceid, metric, value)" +
                            `VALUES('${ts}','${deviceid}','${metric}',${value});`;
            
            await dbClient.query(sql_command);
            console.log("Added data to db");

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

        } catch (err) {
            console.log("Error: ", err);
    }
    
}


/************************************************************************************
*   processMessageRecieved(t:string, m:Buffer)                                      *
*                                                                                   *
*   do something with recieved message                                              *
*                                                                                   *
*                                                                                   *
************************************************************************************/
async function processMessageRecieved(t:string, m:Buffer)
{
    //console.log(`Recv: ${m.toString()} on topic: ${t}`);
    
    // split payload from MQTT into separate timestamp and value
    let payload = JSON.parse(m.toString());
    let topicComponents:string[] = t.split(`/`)
    let rawdata:string = '';
    
    // debug info
    //console.log(topicComponents);
    
    rawdata = `"${payload.timestamp}","${topicComponents[0]}","${topicComponents[1]}","${topicComponents[2]}","${topicComponents[3]}",
                "${topicComponents[4]}","${topicComponents[5]}","${topicComponents[6]}","${topicComponents[7]}","${payload.value}\n`;

    console.log("parsed data: ", rawdata);
    fs.appendFileSync("c:/capstone/csvdata/database2.csv", rawdata);
}

main();     // Execute main function