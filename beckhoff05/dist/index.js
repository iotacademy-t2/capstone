"use strict";
/*
*   index.ts
*   this source file will implement [TODO: Add in description]
*
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// import statements
const ads = __importStar(require("ads-client"));
const fs = __importStar(require("fs"));
const mqtt = __importStar(require("mqtt"));
const path = __importStar(require("path"));
// global variables
var config;
let configFileName = setConfigurationFilename("config.json");
let tagsFileName = setConfigurationFilename("tags.txt");
/*
*   function main();
*
*   This is the mainline code for our project. This code will
*   perform the following work:
*   TODO: Add in description
*/
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Starting code");
        // read config in runtime
        config = readFileAsJSON(configFileName);
        // read tags from taglist
        let tags = readFileAsArray(tagsFileName);
        // build MQTT base topic
        config.mqtt.baseTopic = config.mqtt.organization + "/" + config.mqtt.division + "/" + config.mqtt.plant + "/" + config.mqtt.area
            + "/" + config.mqtt.line + "/" + config.mqtt.workstation + "/" + config.mqtt.type;
        try {
            // make a connection to the Beckhoff platform
            const adsclient = new ads.Client(config.ads);
            yield adsclient.connect();
            // make a connetion to MQTT broker
            let url = config.mqtt.brokerUrl + ":" + config.mqtt.mqttPort;
            console.log("URL: ", url);
            const mqttclient = yield mqtt.connectAsync(url);
            console.log("mqtt connected!");
            // call processReadRequest function
            //await processReadRequest(adsclient, tags, mqttclient);
            setInterval(processReadRequest, 1000, adsclient, tags, mqttclient);
            // set up asynchronus disconnection support via signals
            const shutdown = () => __awaiter(this, void 0, void 0, function* () {
                console.log("Disconnecting our services now");
                yield adsclient.disconnect();
                yield mqttclient.endAsync();
                // TODO: Add in other requests to disconnect from services
                process.exit();
            });
            // set handlers
            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);
        }
        catch (err) {
            console.log("Error: ", err);
        }
    });
}
/************************************************************************************
*   processReadRequest (adsclient: ads.Client, tags:string[])                       *
*                                                                                   *
*   this function will process all ADS reads to PLC tags in the tags array          *
*                                                                                   *
************************************************************************************/
function processReadRequest(adsclient, tags, mqttclient) {
    return __awaiter(this, void 0, void 0, function* () {
        // set up a variable to hold the results of the read of PLC data
        let data;
        let i = 0;
        // one common timestamp for all of the readings we're doing
        let d = new Date();
        try {
            // iterate through all tags
            for (i = 0; i < tags.length; i++) {
                // read PLC tag and output
                data = yield adsclient.readSymbol(tags[i]);
                console.log("data for tag:", tags[i], "is: ", data.value);
                // MQTT payload and topic processing
                let topic = config.mqtt.baseTopic + "/" + tags[i];
                let payload = {
                    "timestamp": d.toISOString(),
                    "value": data.value.toString()
                };
                // Connect to MQTT broker and output
                yield mqttclient.publishAsync(topic, JSON.stringify(payload));
                console.log("published: ", topic, " with payload: ", JSON.stringify(payload));
            }
        }
        catch (err) {
            let rowNumber = i + 1;
            console.error('Exception on row: ', rowNumber, "error: ", err);
        }
    });
}
/************************************************************************************
*   readFilesAsArray (fname:string): string[]                                       *
*                                                                                   *
*   this function will read data in file as array, return data                      *
*   in an array of strings                                                          *
*                                                                                   *
************************************************************************************/
function readFileAsArray(fname) {
    let textlines = fs.readFileSync(fname).toString().split("\r\n");
    return textlines;
}
/************************************************************************************
*   readFilesAsJSON (fname:string): string                                          *
*                                                                                   *
*   this function will read data in file as JSON, return data                       *
*   as JSON encoded string                                                          *
*                                                                                   *
************************************************************************************/
function readFileAsJSON(fname) {
    // read files with data in JSON
    let data = fs.readFileSync(fname).toString();
    return JSON.parse(data);
}
/************************************************************************************
*   setConfigurationFilename (fname:string): string                                 *
*                                                                                   *
*   add the path.dirname() of the program and /../ to go back                       *
*   one level, then add the supplied filename                                       *
*                                                                                   *
************************************************************************************/
function setConfigurationFilename(fname) {
    let fn = path.dirname(__filename) + "/../" + fname;
    return fn;
}
main(); // Execute main function
//# sourceMappingURL=index.js.map