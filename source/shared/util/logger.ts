// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum LoggingLevel {
    ERROR = 1,
    WARN = 2,
    INFO = 3,
    DEBUG = 4,
    VERBOSE = 5
}

/**
 * Logger class
 */
export default class Logger {
    private readonly name: string;
    private readonly loggingLevel: LoggingLevel;

    /**
     * Sets up the default properties.
     *
     * @param name The logger name which will be shown in the log.
     * @param loggingLevel The logging level to show the minimum logs.
     */
    constructor(name: string) {
        this.name = name;
        this.loggingLevel = LoggingLevel.INFO;
        if (process.env.LOGGING_LEVEL !== undefined) {
            try {
                this.loggingLevel = Number(process.env.LOGGING_LEVEL) as LoggingLevel;
            } catch {
                console.log("Could not process configured logging level, defaulting to INFO");
            }
        }
    }

    /**
     * Error logger
     *
     * @param messages The log messages
     */
    public error(...messages: unknown[]): void {
        const loggingLevel = LoggingLevel.ERROR;
        if (loggingLevel <= this.loggingLevel) {
            this._log(loggingLevel, ...messages);
        }
    }

    /**
     * WARN logger
     *
     * @param messages The log messages
     */
    public warn(...messages: unknown[]): void {
        const loggingLevel = LoggingLevel.WARN;
        if (loggingLevel <= this.loggingLevel) {
            this._log(loggingLevel, ...messages);
        }
    }

    /**
     * Info logger
     *
     * @param messages The log messages
     */
    public info(...messages: unknown[]): void {
        const loggingLevel = LoggingLevel.INFO;
        if (loggingLevel <= this.loggingLevel) {
            this._log(loggingLevel, ...messages);
        }
    }

    /**
     * DEBUG logger
     *
     * @param messages The log messages
     */
    public debug(...messages: unknown[]): void {
        const loggingLevel = LoggingLevel.DEBUG;
        if (loggingLevel <= this.loggingLevel) {
            this._log(loggingLevel, ...messages);
        }
    }

    /**
     * VERBOSE logger
     *
     * @param messages The log messages
     */
    public verbose(...messages: unknown[]): void {
        const loggingLevel = LoggingLevel.VERBOSE;
        if (loggingLevel <= this.loggingLevel) {
            this._log(loggingLevel, ...messages);
        }
    }

    /**
     * Logs based on the logging level.
     *
     * @param loggingLevel The logging level of the log
     * @param messages The log messages
     */
    private _log(loggingLevel: LoggingLevel, ...messages: unknown[]): void {
        switch (loggingLevel) {
            case LoggingLevel.VERBOSE:
            case LoggingLevel.DEBUG:
                console.debug(`[${this.name}]`, ...messages);
                break;
            case LoggingLevel.INFO:
                console.info(`[${this.name}]`, ...messages);
                break;
            case LoggingLevel.WARN:
                console.warn(`[${this.name}]`, ...messages);
                break;
            default:
                console.error(`[${this.name}]`, ...messages);
                break;
        }
    }
}
