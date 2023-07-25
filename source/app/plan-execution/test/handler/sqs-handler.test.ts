// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SchedulerClient } from "@aws-sdk/client-scheduler";
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import { API_METRICS_SOLUTION_ID_ENV_KEY } from "shared/api/apiMetrics";
import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { setup } from "../../index";
import { SQSHandler } from "../../src/handler/sqs-handler";
import { NeptuneProxy } from "../../src/proxy/neptune-proxy";
import { SchedulerProxy } from "../../src/proxy/scheduler-proxy";
import {
    apiMetricsKey,
    createInventoryPlanEvent,
    createTransferPlanEvent,
    delay,
    deletePlanEvent,
    id,
    inventoryPlan,
    lambdaArnConst,
    listSchedulesEmptyResponce,
    listSchedulesNonEmptyResponce,
    neptuneHostConst,
    neptunePortConst,
    regionConst,
    scheduleGroupName,
    schedulerRuleArnConst,
    solutionId,
    transferPlan,
    updateInventoryPlanEvent,
    updateTransferPlanEvent
} from "../helper/constants";

const mock = mockClient(SchedulerClient);

describe("sqs-handler", () => {
    beforeEach(() => {
        process.env.NEPTUNE_HOST = neptuneHostConst;
        process.env.NEPTUNE_ENDPOINT = neptuneHostConst;
        process.env.API_METRICS_SOLUTION_ID_ENV_KEY = solutionId;
        process.env.NEPTUNE_PORT = neptunePortConst;
        process.env.REGION = regionConst;
        process.env.LAMBDA_FUNCTION_ARN = lambdaArnConst;
        process.env.SCHEDULER_RULE_ARN = schedulerRuleArnConst;
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = apiMetricsKey;
        process.env.SCHEDULE_GROUP_NAME = scheduleGroupName;
        setup();
        mock.reset();
    });

    test("will construct ok", () => {
        const sqsHandler = new SQSHandler(new SchedulerProxy(), new NeptuneProxy(new NeptuneDB()));

        expect(sqsHandler).toBeDefined();
    });

    test("will handle create inventory plan event ok", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = new NeptuneProxy(neptuneDb);
        const schedulerProxy = new SchedulerProxy();

        neptuneDb.getById = jest.fn()
            .mockImplementationOnce(() => {
                return inventoryPlan;
            })
            .mockImplementationOnce(() => {
                return inventoryPlan;
            }) as any;

        schedulerProxy.createRecurringSchedule = jest.fn().mockImplementationOnce(() => {}) as any;
        schedulerProxy.listSchedules = jest.fn().mockImplementationOnce(() => {
            return listSchedulesEmptyResponce;
        }) as any;

        const sqsHandler = new SQSHandler(schedulerProxy, neptuneProxy);
        const eventString = JSON.stringify(createInventoryPlanEvent);
        await sqsHandler.handleSQSEvent([{ body: eventString }]);

        expect(schedulerProxy.createRecurringSchedule).toHaveBeenCalledTimes(1);
        expect(schedulerProxy.createRecurringSchedule).lastCalledWith(inventoryPlan);
    });

    test("will handle update inventory plan event ok", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = new NeptuneProxy(neptuneDb);
        const schedulerProxy = new SchedulerProxy();

        neptuneDb.getById = jest.fn()
            .mockImplementationOnce(() => {
                return inventoryPlan;
            })
            .mockImplementationOnce(() => {
                return inventoryPlan;
            }) as any;

        schedulerProxy.updateRecurringSchedule = jest.fn().mockImplementationOnce(() => {}) as any;
        schedulerProxy.listSchedules = jest.fn().mockImplementationOnce(() => {
            return listSchedulesNonEmptyResponce;
        }) as any;

        const sqsHandler = new SQSHandler(schedulerProxy, neptuneProxy);
        const eventString = JSON.stringify(updateInventoryPlanEvent);
        await sqsHandler.handleSQSEvent([{ body: eventString }]);

        expect(schedulerProxy.updateRecurringSchedule).toHaveBeenCalledTimes(1);
        expect(schedulerProxy.updateRecurringSchedule).lastCalledWith(inventoryPlan);
    });

    test("will handle create transfer plan event ok", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = new NeptuneProxy(neptuneDb);
        const schedulerProxy = new SchedulerProxy();

        neptuneDb.getById = jest.fn()
            .mockImplementationOnce(() => {
                return transferPlan;
            })
            .mockImplementationOnce(() => {
                return transferPlan;
            }) as any;

        neptuneDb.updateVertex = jest.fn().mockImplementationOnce(() => {}) as any;

        schedulerProxy.createOneTimeSchedule = jest.fn().mockImplementationOnce(() => {}) as any;
        schedulerProxy.listSchedules = jest.fn().mockImplementationOnce(() => {
            return listSchedulesEmptyResponce;
        }) as any;

        const sqsHandler = new SQSHandler(schedulerProxy, neptuneProxy);
        const eventString = JSON.stringify(createTransferPlanEvent);
        await sqsHandler.handleSQSEvent([{ body: eventString }]);

        expect(schedulerProxy.createOneTimeSchedule).toHaveBeenCalledTimes(1);
        expect(schedulerProxy.createOneTimeSchedule).lastCalledWith(transferPlan);
    });

    test("will handle update transfer plan event ok", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = new NeptuneProxy(neptuneDb);
        const schedulerProxy = new SchedulerProxy();

        neptuneDb.getById = jest.fn()
            .mockImplementationOnce(() => {
                return transferPlan;
            })
            .mockImplementationOnce(() => {
                return transferPlan;
            }) as any;

        schedulerProxy.updateOneTimeSchedule = jest.fn().mockImplementationOnce(() => {}) as any;
        schedulerProxy.listSchedules = jest.fn().mockImplementationOnce(() => {
            return listSchedulesNonEmptyResponce;
        }) as any;

        const sqsHandler = new SQSHandler(schedulerProxy, neptuneProxy);
        const eventString = JSON.stringify(updateTransferPlanEvent);
        await sqsHandler.handleSQSEvent([{ body: eventString }]);

        expect(schedulerProxy.updateOneTimeSchedule).toHaveBeenCalledTimes(1);
        expect(schedulerProxy.updateOneTimeSchedule).lastCalledWith(transferPlan);
    });

    test("will handle delete plan event ok", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = new NeptuneProxy(neptuneDb);
        const schedulerProxy = new SchedulerProxy();

        neptuneDb.getById = jest.fn().mockImplementationOnce(() => {
            return undefined;
        }) as any;

        schedulerProxy.deleteSchedule = jest.fn().mockImplementationOnce(() => {}) as any;
        schedulerProxy.listSchedules = jest.fn().mockImplementationOnce(() => {
            return listSchedulesNonEmptyResponce;
        }) as any;

        const sqsHandler = new SQSHandler(schedulerProxy, neptuneProxy);
        const eventString = JSON.stringify(deletePlanEvent);
        await sqsHandler.handleSQSEvent([{ body: eventString }]);

        expect(schedulerProxy.deleteSchedule).toHaveBeenCalledTimes(1);
        expect(schedulerProxy.listSchedules).lastCalledWith(id);
    });
});
