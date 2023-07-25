// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import { Config } from "../util/config";
import { CfProxy } from "../proxy/cf-proxy";
import { ApiProxy } from "../proxy/api-proxy";
import { Seeder } from "../util/seeder";
import { TransferPlanSeederResponse } from "../util/constants";
import { logger } from "../util/logger";
import { LambdaProxy } from "../proxy/lambda-proxy";
import { SchedulerProxy } from "../proxy/scheduler-proxy";
import { validateOnetimeSchedulerDetails, validateTransferPlanIsExecuted } from "../factory/validation-factory";
import * as moment from "moment";
import { TransferPlan } from "shared/neptune/model/transfer-plan";
import { TransferPlanStatus } from "shared/neptune/model/constants";
import { checkResults } from "../util/result-checker";

jest.setTimeout(1000000);

describe("transfer-plan-execution", () => {
    let config: Config;
    let cfProxy: CfProxy;
    let lambdaProxy: LambdaProxy;
    let schedulerProxy: SchedulerProxy;
    let endpoint: string;
    let apiProxy: ApiProxy;
    let seeder: Seeder;
    let response: TransferPlanSeederResponse;
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
        response = await seeder.persistTransferPlanForPlanExecution();
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

    test("will able to execute ship plan", async () => {
        const schedulerDetails = await schedulerProxy.getOneTimeSchedulerDetails(
            response.planId + "-ship",
            scheduleGroupName
        );
        const lambdaFunctionName = await cfProxy.getPlanExecutionLambdaName();
        await lambdaProxy.invoke(lambdaFunctionName, JSON.parse(schedulerDetails.input));
        logger.info(`${moment.utc()}: Invoked Plan Execution with customized input`);

        /**
         * Wait for following actions to be performed before checking Scheduler:
         *     a. Integration test triggers Plan Execution.
         *     d. Plan Execution updates item.
         */

        // Validate if EventBridge Scheduler is executed.
        await checkResults(checkShipSchedulerExecution);
    });

    test("will able to execute arrival plan", async () => {
        const schedulerDetails = await schedulerProxy.getOneTimeSchedulerDetails(
            response.planId + "-arrival",
            scheduleGroupName
        );
        const lambdaFunctionName = await cfProxy.getPlanExecutionLambdaName();
        await lambdaProxy.invoke(lambdaFunctionName, JSON.parse(schedulerDetails.input));
        logger.info(`${moment.utc()}: Invoked Plan Execution with customized input`);

        /**
         * Wait for following actions to be performed before checking Scheduler:
         *     a. Integration test triggers Plan Execution.
         *     d. Plan Execution updates item.
         */

        // Validate if EventBridge Scheduler is executed.
        await checkResults(checkArrivalSchedulerExecution);
    });

    test("will able to delete scheduler", async () => {
        logger.info(`${moment.utc()}: Validating if EventBridge Scheduler is deleted`);
        await seeder.cleanUpForTransferPlanExecution(response);
        logger.info(`${moment.utc()}: Deleted sample data from Neptune`);
        logger.info("Delay 60 seconds for data processing before validation");

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

        const arrivalSchedulerDetails = await schedulerProxy.getOneTimeSchedulerDetails(
            response.planId + "-arrival",
            scheduleGroupName
        );
        validateOnetimeSchedulerDetails(arrivalSchedulerDetails);

        const shipSchedulerDetails = await schedulerProxy.getOneTimeSchedulerDetails(
            response.planId + "-ship",
            scheduleGroupName
        );
        validateOnetimeSchedulerDetails(shipSchedulerDetails);
    }

    async function checkShipSchedulerExecution() {
        logger.info(`${moment.utc()}: Validating if Plan Execution is able to execute ship plan`);
        const fromItem = await apiProxy.getItem(response.fromItemId);
        const toItem = await apiProxy.getItem(response.toItemId);
        const transferPlans: TransferPlan[] = await apiProxy.getTransferPlanByLocation(response.fromLocationId);
        const filteredPlans = transferPlans.filter(plan => (plan.id = response.planId));
        validateTransferPlanIsExecuted(fromItem, toItem, filteredPlans[0], TransferPlanStatus.IN_TRANSIT);
    }

    async function checkArrivalSchedulerExecution() {
        logger.info(`${moment.utc()}: Validating if Plan Execution is able to execute arrival plan`);
        const fromItem = await apiProxy.getItem(response.fromItemId);
        const toItem = await apiProxy.getItem(response.toItemId);
        const transferPlans: TransferPlan[] = await apiProxy.getTransferPlanByLocation(response.toLocationId);
        const filteredPlans = transferPlans.filter(plan => (plan.id = response.planId));
        validateTransferPlanIsExecuted(fromItem, toItem, filteredPlans[0], TransferPlanStatus.SUCCEED);
    }

    async function checkSchedulerDeletion() {
        logger.info(`${moment.utc()}: Validating if EventBridge Scheduler is deleted`);
        const result = await schedulerProxy.isSchedulerExist(response.planId, scheduleGroupName);
        expect(result).toEqual(false);
    }
});
