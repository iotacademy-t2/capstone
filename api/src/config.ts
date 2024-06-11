/*
 * config.ts
 *
 * Helper class that provides file reading and path manipulation functionalities.
 */

import * as fs from "fs";
import * as path from "path";

export class Configuration {
    // Parse file and return content as string array, delimited by newlines
    public static readFileAsArray(fname: string): string[] {
        let textlines: string[] = fs.readFileSync(fname).toString().split("\r\n");
        return textlines;
    }

    // Parse file and return content parsed as a JSON object
    public static readFileAsJSON(fname: string): any {
        let data: string = fs.readFileSync(fname).toString();
        return JSON.parse(data);
    }

    // Get path of active file and append supplied filename
    public static setConfigurationFilename(fname: string): string {
        let fn: string = path.dirname(__filename) + "/../" + fname;
        return fn;
    }
}
