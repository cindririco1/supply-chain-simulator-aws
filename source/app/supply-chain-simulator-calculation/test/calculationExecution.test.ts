// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, jest, test } from "@jest/globals";
import { API_METRICS_SOLUTION_ID_ENV_KEY } from "shared/api/apiMetrics";
import { Calculator } from "../src/calculation/calculator";
import { CalculationExecution } from "../src/calculationExecution";
import { FutureDateHandler } from "../src/futureDates/futureDateHandler";
import { SQSQueue } from "../src/messaging/sqsQueue";
import { FutureDate } from "../src/model/futureDate";
import { DataChange } from "../src/types/queueMessageType";
import { Config } from "../src/util/config";
import { LoggerManager } from "../src/util/logger";

describe("calculation execution", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();

    test("will update future dates when looptracker exceeds futureDateInterval", async () => {
        // Arrange
        process.env.TIME_INTERVAL = "1";
        process.env.NEPTUNE_ENDPOINT = "some-url";
        process.env.NEPTUNE_PORT = "8182";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";
        process.env.CALCULATION_SERVICE_DEADLETTER_QUEUE_URL = "some-other-url";
        process.env.BATCH_SIZE = "5000";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        const expectedFutureDate: FutureDate = {
            date: new Date(),
            daysOut: 1
        };

        const futureDateHandler = FutureDateHandler.prototype;
        futureDateHandler.updateFutureDates = jest.fn() as any;
        futureDateHandler.getAllFutureDates = jest.fn().mockImplementation(() => {
            return [expectedFutureDate];
        }) as any;

        const calculator = Calculator.prototype;
        calculator.setFutureDates = jest.fn() as any;

        const sqsQueue = SQSQueue.prototype;
        sqsQueue.receive = jest.fn().mockImplementation(() => {
            return [];
        }) as any;

        const config = new Config(logger);
        const calcExecution = new CalculationExecution(config, futureDateHandler, sqsQueue, logger, calculator, 2);

        // Act
        await calcExecution.execute(); //looptracker => 1
        await calcExecution.execute(); //looptracker => 2
        await calcExecution.execute(); //looptracker => 3

        // Assert
        expect(futureDateHandler.updateFutureDates).toHaveBeenCalledTimes(1);
        expect(calculator.setFutureDates).toHaveBeenCalledWith([expectedFutureDate]);
    });

    test("will run calculation when messages found on queue and will delete successful messages from the queue", async () => {
        // Arrange
        process.env.TIME_INTERVAL = "1";
        process.env.NEPTUNE_ENDPOINT = "some-url";
        process.env.NEPTUNE_PORT = "8182";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";
        process.env.CALCULATION_SERVICE_DEADLETTER_QUEUE_URL = "some-other-url";
        process.env.BATCH_SIZE = "5000";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        const futureDateHandler = FutureDateHandler.prototype;
        futureDateHandler.updateFutureDates = jest.fn() as any;

        const dataChanges: DataChange[] = [
            {
                id: "stub-id",
                op: "ADD",
                key: "some-key",
                label: "some-label",
                value: {
                    value: "some-string",
                    dataType: "string"
                },
                sqs: {
                    messageId: "stub-message-id",
                    numberOfFailures: 0,
                    receiptHandle: "some-receipt-handle"
                }
            }
        ];
        const calculationResult = {
            successes: [dataChanges],
            failures: []
        };

        const sqsQueue = SQSQueue.prototype;
        sqsQueue.receive = jest.fn().mockImplementation(() => {
            return dataChanges;
        }) as any;
        sqsQueue.deleteMessages = jest.fn() as any;
        sqsQueue.sendMessagesWithFailure = jest.fn() as any;

        const calculator = Calculator.prototype;
        calculator.calculate = jest.fn().mockImplementation(() => {
            return calculationResult;
        }) as any;

        const config = new Config(logger);
        const calcExecution = new CalculationExecution(config, futureDateHandler, sqsQueue, logger, calculator, 60);

        // Act
        await calcExecution.execute();

        // Assert
        expect(calculator.calculate).toHaveBeenCalledWith(dataChanges);
        expect(sqsQueue.deleteMessages).toHaveBeenCalledWith(calculationResult.successes);
    });
});
