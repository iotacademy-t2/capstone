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

    public static generateTimesTable(ttable: number, start: number, end: number): string[] {
        let output: string[] = [];
        let offset: number = 0;
        let p: number = 0;
        let x: number = 0;
        for (x = start; x <= end; x++) {
            output[offset] = `${x} x ${ttable} = ${x * ttable}`;
            offset++;
        }
        return output;
    }
}
