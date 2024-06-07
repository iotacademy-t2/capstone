/*
*   index.ts
*   this source file will implement [TODO: Add in description]
*
*/

// import statements
import * as ads from 'ads-client';
import * as fs from 'fs';
import * as mqtt from 'mqtt';
import * as path from 'path';

// global variables
var config:any;
let configFileName:string = setConfigurationFilename("config.json");
let tagsFileName:string = setConfigurationFilename("tags.txt");
let statustagsFileName:string = setConfigurationFilename("statustags.txt");

/************************************************************************************
*   Main ()                                                                         *
*                                                                                   *
*   this program will read PLC tags and publish the to MQTT broker                  *
*                                                                                   *
************************************************************************************/
async function main() {

    console.log("Starting code");
    
    // read config in runtime
    config = readFileAsJSON(configFileName);

    // read tags from taglist
    let tags:string[] = readFileAsArray(tagsFileName);
    let statustags:string[] = readFileAsArray(statustagsFileName);

    // build MQTT base topic
    config.mqtt.baseTopic = config.mqtt.organization + "/" + config.mqtt.division + "/" + config.mqtt.plant + "/" + config.mqtt.area 
                                + "/" + config.mqtt.line + "/" + config.mqtt.workstation + "/" + config.mqtt.type;

    
    try 
    {
            // make a connection to the Beckhoff platform
            const adsclient = new ads.Client (config.ads);
            await adsclient.connect();

            // make a connetion to MQTT broker
            let url:string = config.mqtt.brokerUrl + ":" + config.mqtt.mqttPort;
            console.log("URL: ", url);
            const mqttclient:mqtt.MqttClient = await mqtt.connectAsync(url);
            console.log("mqtt connected!");

            // call processReadRequest function
            //await processReadRequest(adsclient, tags, mqttclient);
            setInterval(processReadRequest, 1000, adsclient, tags, mqttclient);
            
            // set up asynchronus disconnection support via signals
            const shutdown = async() => {
                console.log("Disconnecting our services now");
                await adsclient.disconnect();
                await mqttclient.endAsync();
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
*   processReadRequest (adsclient: ads.Client, tags:string[])                       *
*                                                                                   *
*   this function will process all ADS reads to PLC tags in the tags array          *
*                                                                                   *
************************************************************************************/
async function processReadRequest (adsclient: ads.Client, tags:string[], mqttclient:mqtt.MqttClient)
{
    // set up a variable to hold the results of the read of PLC data
    let data:ads.SymbolData;
    let i:number = 0;
    // one common timestamp for all of the readings we're doing
    let d:Date = new Date();
    
    try {
        // iterate through all tags
        for (i = 0; i < tags.length; i++) {
            // read PLC tag and output
            data = await adsclient.readSymbol (tags[i]);
            console.log("data for tag:", tags[i], "is: ", data.value);    

            // MQTT payload and topic processing
            let topic:string = config.mqtt.baseTopic + "/" + tags[i];
            let payload = {
                "timestamp": d.toISOString(),
                "value": data.value.toString()
            };
            
            // Connect to MQTT broker and output
            await mqttclient.publishAsync(topic, JSON.stringify(payload));
            console.log("published: ", topic, " with payload: ", JSON.stringify(payload));
        }
    } catch (err) {
        let rowNumber:number = i+1;
        console.error('Exception on row: ', rowNumber, "error: ", err);
        
    }
}

/************************************************************************************
*   readFilesAsArray (fname:string): string[]                                       *
*                                                                                   *
*   this function will read data in file as array, return data                      *
*   in an array of strings                                                          *
*                                                                                   *
************************************************************************************/
function readFileAsArray(fname:string): string[]
{
    let textlines:string[] = fs.readFileSync(fname).toString().split("\r\n");
    return textlines;
}

/************************************************************************************
*   readFilesAsJSON (fname:string): string                                          *
*                                                                                   *
*   this function will read data in file as JSON, return data                       *
*   as JSON encoded string                                                          *
*                                                                                   *
************************************************************************************/
function readFileAsJSON(fname:string): string
{
    // read files with data in JSON
    let data:string = fs.readFileSync(fname).toString();
    return JSON.parse(data);
}

/************************************************************************************
*   setConfigurationFilename (fname:string): string                                 *
*                                                                                   *
*   add the path.dirname() of the program and /../ to go back                       *
*   one level, then add the supplied filename                                       *
*                                                                                   *
************************************************************************************/
function setConfigurationFilename(fname:string): string
{
    let fn:string = path.dirname(__filename) + "/../" + fname;
    return fn;
}

main();     // Execute main function