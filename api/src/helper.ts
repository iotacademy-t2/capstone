// TODO - comments and logger!!!!
import { logger } from "./logger";

export class Helper {
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

    public static convertDataToString(data: any): string {
        let s: string = "";
        if (data != undefined) {
            s = data.toString();
        }
        return s;
    }

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
}
