// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Pino from "pino";
import { v4 as uuidv4 } from "uuid";

/**
 * Centralized logger manager class for entire app
 */
export class LoggerManager {
    parentLogger: Pino.Logger;
    logger: Pino.Logger;

    constructor() {
        this.parentLogger = Pino({
            name: "supply-chain-simulator-on-aws",
            level: process.env.LOG_LEVEL === undefined ? "info" : process.env.LOG_LEVEL
        });
    }

    /**
     * Singleton method for getting logger object
     * @param reset Whether to force new logger from singleton
     * @returns
     */
    public getLogger(reset = false): Pino.Logger {
        if (this.logger == undefined || reset) {
            this.logger = this.parentLogger.child({ correlationId: uuidv4() });
        }
        return this.logger;
    }
}
