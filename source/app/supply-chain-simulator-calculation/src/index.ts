// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { CalculationDataAccess } from "./calculation/calculationDataAccess";
import { Calculator } from "./calculation/calculator";
import { ViolationDataAccess } from "./calculation/violations/violationDataAccess";
import { CalculationExecution } from "./calculationExecution";
import { FutureDateDataAccess } from "./futureDates/futureDateDataAccess";
import { FutureDateHandler } from "./futureDates/futureDateHandler";
import { CalculationQueue } from "./messaging/calculationQueueInterface";
import { LocalQueue } from "./messaging/localQueue";
import { SQSQueue } from "./messaging/sqsQueue";
import { Config } from "./util/config";
import { LoggerManager } from "./util/logger";

async function main(): Promise<void> {
    const loggerManager = new LoggerManager();
    loggerManager.parentLogger.info("Starting Calculation Service");

    // new up all necessary components to run calculation engine
    const config = new Config(loggerManager.parentLogger.child({ module: "Config" }));
    const neptuneDb = new NeptuneDB(config.localMode);
    const futureDateDataAccess = new FutureDateDataAccess(
        neptuneDb,
        loggerManager.parentLogger.child({ module: "FutureDateDataAccess" })
    );
    const futureDateHandler = new FutureDateHandler(
        futureDateDataAccess,
        loggerManager.parentLogger.child({ module: "FutureDateHandler" })
    );

    let queue: CalculationQueue = new SQSQueue(
        config.calculationServiceQueueUrl,
        config.calculationServiceDeadletterQueueUrl,
        20,
        loggerManager.parentLogger.child({ module: "CalculationQueue" })
    );
    if (config.localMode) {
        queue = new LocalQueue();
    }

    await futureDateHandler.updateFutureDates();
    const futureDates = await futureDateDataAccess.getAllFutureDates();

    const logger = loggerManager.getLogger(true);

    const calculationDataAccess = new CalculationDataAccess(
        neptuneDb,
        logger.child({ module: "CalculationDataAccess" })
    );

    const violationDataAccess = new ViolationDataAccess(neptuneDb, logger.child({ module: "ViolationDataAccess" }));

    const calculator = new Calculator(
        calculationDataAccess,
        violationDataAccess,
        futureDates,
        logger.child({ module: "Calculator" })
    );

    const futureDateCheckInterval = 30 * 1000;
    const calculationExecution = new CalculationExecution(
        config,
        futureDateHandler,
        queue,
        logger,
        calculator,
        futureDateCheckInterval
    );
    // execute infinite loop with sleeps when queue is empty
    const execute = true;
    while (execute) {
        await calculationExecution.execute();
    }

    loggerManager.parentLogger.info("Exiting Calculation Service");
}

main();
