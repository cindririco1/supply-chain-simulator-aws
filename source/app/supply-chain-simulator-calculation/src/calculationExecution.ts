// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";
import { Calculator } from "./calculation/calculator";
import { deDupe } from "./calculation/deduper";
import { FutureDateHandler } from "./futureDates/futureDateHandler";
import { CalculationQueue } from "./messaging/calculationQueueInterface";
import { Config } from "./util/config";

export class CalculationExecution {
    private loopTracker: number;
    private futureDateInterval: number;
    private config: Config;
    private futureDateHandler: FutureDateHandler;
    private queue: CalculationQueue;
    private logger: Logger;
    private calculator: Calculator;

    constructor(
        config: Config,
        futureDateHandler: FutureDateHandler,
        queue: CalculationQueue,
        logger: Logger,
        calculator: Calculator,
        futureDateInterval: number
    ) {
        this.loopTracker = 0;
        this.futureDateInterval = futureDateInterval;
        this.config = config;
        this.futureDateHandler = futureDateHandler;
        this.queue = queue;
        this.logger = logger;
        this.calculator = calculator;
    }

    public async execute(): Promise<void> {
        if (this.loopTracker >= this.futureDateInterval) {
            this.loopTracker = 0;
            await this.futureDateHandler.updateFutureDates();
            const futureDates = await this.futureDateHandler.getAllFutureDates();
            this.calculator.setFutureDates(futureDates);
        }

        // read messages off of queue per batch
        const dataChanges = await this.queue.receive();
        if (dataChanges.length == 0) {
            // sleep for a while to reduce processing cost
            await new Promise(r => setTimeout(r, this.config.timeInterval));
            this.loopTracker += this.config.timeInterval;
        } else {
            this.logger.debug(`Received ${dataChanges.length} messages from queue`);

            // de-dupe the ids
            const deDupedDataChanges = deDupe(dataChanges);

            const result = await this.calculator.calculate(deDupedDataChanges);

            this.logger.debug(`Successes: ${JSON.stringify(result.successes)}`);
            this.logger.debug(`Failures: ${JSON.stringify(result.failures)}`);

            await this.queue.deleteMessages(result.successes);
            await this.queue.deleteMessages(result.failures);
            await this.queue.sendMessagesWithFailure(result.failures);
        }
    }
}
