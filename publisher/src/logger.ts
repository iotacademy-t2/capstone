/*
 *  Helper class to expose 'logger', that's basically just a wrapper around
 *  the 'Winston' logging module, preconfigured with defaults according to our
 *  needs.
 */

import { createLogger, transports, format } from "winston";

export const logger = createLogger({
    transports: [
        // console handler - string output
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.timestamp(),
                format.printf(({ timestamp, level, message }) => {
                    return `[${timestamp}] ${level}: ${message}`;
                })
            ),
        }),
        // filehandler - JSON output
        new transports.File({
            dirname: "../logs",
            filename: "publisher.log",
            format: format.combine(format.timestamp(), format.json()),
        }),
    ],
});
