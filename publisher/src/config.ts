// import statements
import fs from "fs";
import path from "path";

export class Configuration {
    /************************************************************************************
     *   readFilesAsArray (fname:string): string[]                                       *
     *                                                                                   *
     *   this function will read data in file as array, return data                      *
     *   in an array of strings                                                          *
     *                                                                                   *
     ************************************************************************************/
    public static readFileAsArray(fname: string): string[] {
        let textlines: string[] = fs.readFileSync(fname).toString().split("\r\n");
        return textlines;
    }

    /************************************************************************************
     *   readFilesAsJSON (fname:string): string                                          *
     *                                                                                   *
     *   this function will read data in file as JSON, return data                       *
     *   as JSON encoded string                                                          *
     *                                                                                   *
     ************************************************************************************/
    public static readFileAsJSON(fname: string): string {
        // read files with data in JSON
        let data: string = fs.readFileSync(fname).toString();
        return JSON.parse(data);
    }

    /************************************************************************************
     *   setConfigurationFilename (fname:string): string                                 *
     *                                                                                   *
     *   add the path.dirname() of the program and /../ to go back                       *
     *   one level, then add the supplied filename                                       *
     *                                                                                   *
     ************************************************************************************/
    public static setConfigurationFilename(fname: string): string {
        let fn: string = path.dirname(__filename) + "/../" + fname;
        return fn;
    }
}
