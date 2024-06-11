/*
 *  helper.ts
 *
 *  Helper class that provides functions for data validation and query creation
 */

import { logger } from "./logger";

export class Helper {
    // return int if valid, else default value
    public static convertDataToInteger(data: any, def: number): number {
        let n: number = def;
        if (data != undefined) {
            n = parseInt(data.toString(), 10);
            if (Number.isNaN(n)) {
                n = def;
            }
        }
        return n;
    }

    // return string if valid, else empty string
    public static convertDataToString(data: any): string {
        let s: string = "";
        if (data != undefined) {
            s = data.toString();
        }
        return s;
    }

    // return ISO timestamp as string if valid, else empty string
    public static checkValidDate(data: any): string {
        if (data != undefined) {
            try {
                let dateParsed: Date = new Date(`${data}`);
                if (dateParsed.toISOString() == data) {
                    return data.toString();
                }
            } catch (error) {
                logger.error(`Invalid date: ${data}`);
            }
        }
        return "";
    }

    // create SQL query based on inputs
    public static createQuery(l: any, s: any, e: any, m: any): string {
        // default values???
        let query: string = "";
        let base: string = "SELECT * FROM telemetry";

        let limit: number = this.convertDataToInteger(l, 100);
        let start: string = this.checkValidDate(s);
        let end: string = this.checkValidDate(e);
        let metric: string = this.convertDataToString(m);

        query += base;
        if (start != "" || end != "" || metric != "") {
            query += " WHERE";
            if (start != "") query += ` timestamp > '${start}'`;
            if (end != "") query += ` timestamp < '${end}'`;
        }
        query += ` LIMIT ${limit}`;

        return query;
    }
}
