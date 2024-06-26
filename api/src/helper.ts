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
                return dateParsed.toISOString();
            } catch (error) {
                logger.error(`Invalid date: ${data}`);
            }
        }
        return "";
    }

    // create SQL query based on inputs
    public static createQuery(l: any, s: any, e: any, m: any, o: any): string {
        let query: string = "";

        // check values
        let limit: number = this.convertDataToInteger(l, 100);
        let start: string = this.checkValidDate(s);
        let end: string = this.checkValidDate(e);
        let metric: string = this.convertDataToString(m);
        let order: string = this.convertDataToString(o);

        // default values if empty
        if (start == "") {
            let startOfDay = new Date("2024-06-10");
            start = startOfDay.toISOString();
        }
        if (end == "" || end < start || end == start) end = new Date().toISOString();
        if (order == "" || order.toLowerCase() != "desc") order = "ASC";

        if (limit === 0)
            query = `SELECT * FROM telemetry WHERE timestamp > '${start}' AND timestamp < '${end}' AND LOWER(metric) LIKE LOWER('%${metric}%') ORDER BY timestamp ${order.toUpperCase()}`;
        else
            query = `SELECT * FROM telemetry WHERE timestamp > '${start}' AND timestamp < '${end}' AND LOWER(metric) LIKE LOWER('%${metric}%') ORDER BY timestamp ${order.toUpperCase()} LIMIT ${limit};`;

        logger.info(query);
        return query;
    }
}
