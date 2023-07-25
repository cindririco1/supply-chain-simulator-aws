// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import { Config } from "../util/config";
import { CfProxy } from "../proxy/cf-proxy";
import { ApiProxy } from "../proxy/api-proxy";
import { Seeder } from "../util/seeder";
import { InventoryPlanSeederResponse, turnoverHour, updatedTurnoverHour } from "../util/constants";
import { logger } from "../util/logger";
import { LambdaProxy } from "../proxy/lambda-proxy";
import { SchedulerProxy } from "../proxy/scheduler-proxy";
import { validateInventoryPlanIsExecuted, validateRecurringSchedulerDetails } from "../factory/validation-factory";
import * as moment from "moment";
import { checkResults } from "../util/result-checker";

jest.setTimeout(1000000);

describe("inventory-plan-execution", () => {
    let config: Config;
    let cfProxy: CfProxy;
    let lambdaProxy: LambdaProxy;
    let schedulerProxy: SchedulerProxy;
    let endpoint: string;
    let apiProxy: ApiProxy;
    let seeder: Seeder;
    let response: InventoryPlanSeederResponse;
    let scheduleGroupName: string;

    beforeAll(async () => {
        config = new Config();
        cfProxy = new CfProxy(config);
        lambdaProxy = new LambdaProxy(config);
        schedulerProxy = new SchedulerProxy(config);
        endpoint = await cfProxy.getApiEndpoint();
        apiProxy = new ApiProxy(config, endpoint, cfProxy);
        seeder = new Seeder(apiProxy);
        scheduleGroupName = await cfProxy.getScheduleGroupName();
    });

    test("will able to create event bridge scheduler", async () => {
        logger.info(`${moment.utc()}: Integration test preparation started`);

        // Persists sample data to the Neptune DB for vertex creation.
        response = await seeder.persistInventoryPlanForPlanExecution();
        logger.info(`${moment.utc()}: Persisted sample data to Neptune`);

        /**
         * Wait for following actions to be performed before checking Scheduler:
         *     a. Integration test persists sample data to the Neptune DB.
         *     b. Neptune DB publishes Change log to Neptune Stream.
         *     c. Stream Poller detects Change log and reroutes it to SQS, it checks per 5 minutes.
         *     d. Plan Execution triggered by SQS event and creates Scheduler.
         */

        // Validate if EventBridge Scheduler is created.
        await checkResults(checkSchedulerCreation);
    });

    test("will able to update scheduler", async () => {
        await seeder.updateInventoryPlan(response.itemId, response.planId);
        logger.info(`${moment.utc()}: Persisted updated sample data to Neptune`);

        /**
         * Wait for following actions to be performed before checking Scheduler:
         *     a. Integration test persists sample data to the Neptune DB.
         *     b. Neptune DB publishes Change log to Neptune Stream.
         *     c. Stream Poller detects Change log and reroutes it to SQS, it checks per 5 minutes.
         *     d. Plan Execution triggered by SQS event and updates Scheduler.
         */

        // Validate if EventBridge Scheduler is updated.
        await checkResults(checkRecurringSchedulerDetails);
    });

    test("will able to execute plan", async () => {
        const schedulerDetails = await schedulerProxy.getRecurringSchedulerDetails(response.planId, scheduleGroupName);
        const lambdaFunctionName = await cfProxy.getPlanExecutionLambdaName();
        await lambdaProxy.invoke(lambdaFunctionName, JSON.parse(schedulerDetails.input));
        logger.info(`${moment.utc()}: Invoked Plan Execution with customized input`);

        /**
         * Wait for following actions to be performed before checking Scheduler:
         *     a. Integration test triggers Plan Execution.
         *     d. Plan Execution updates item.
         */

        // Validate if EventBridge Scheduler is executed.
        await checkResults(checkSchedulerExecution);
    });

    test("will able to delete scheduler", async () => {
        await seeder.cleanUpForInventoryPlanExecution(response);
        logger.info(`${moment.utc()}: Deleted sample data from Neptune`);

        /**
         * Wait for following actions to be performed before checking Scheduler:
         *     a. Integration test persists sample data to the Neptune DB.
         *     b. Neptune DB publishes Change log to Neptune Stream.
         *     c. Stream Poller detects Change log and reroutes it to SQS, it checks per 5 minutes.
         *     d. Plan Execution triggered by SQS event and deletes Scheduler.
         */

        // Validate if EventBridge Scheduler is deleted.
        await checkResults(checkSchedulerDeletion);
    });

    async function checkSchedulerCreation() {
        logger.info(`${moment.utc()}: Validating if EventBridge Scheduler is created`);
        expect(await schedulerProxy.isSchedulerExist(response.planId, scheduleGroupName)).toEqual(true);
        const schedulerDetails = await schedulerProxy.getRecurringSchedulerDetails(response.planId, scheduleGroupName);
        validateRecurringSchedulerDetails(schedulerDetails, turnoverHour);
    }

    async function checkRecurringSchedulerDetails() {
        logger.info(`${moment.utc()}: Validating if EventBridge Scheduler is updated`);
        const schedulerDetails = await schedulerProxy.getRecurringSchedulerDetails(response.planId, scheduleGroupName);
        validateRecurringSchedulerDetails(schedulerDetails, updatedTurnoverHour);
    }

    async function checkSchedulerExecution() {
        logger.info(`${moment.utc()}: Validating if EventBridge Scheduler is executed`);
        const item = await apiProxy.getItem(response.itemId);
        validateInventoryPlanIsExecuted(item);
    }

    async function checkSchedulerDeletion() {
        logger.info(`${moment.utc()}: Validating if EventBridge Scheduler is deleted`);
        const result = await schedulerProxy.isSchedulerExist(response.planId, scheduleGroupName);
        expect(result).toEqual(false);
    }
});
