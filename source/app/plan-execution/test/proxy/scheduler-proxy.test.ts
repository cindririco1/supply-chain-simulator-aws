// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    CreateScheduleCommand,
    DeleteScheduleCommand,
    GetScheduleCommand,
    ListSchedulesCommand,
    SchedulerClient,
    UpdateScheduleCommand
} from "@aws-sdk/client-scheduler";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import { API_METRICS_SOLUTION_ID_ENV_KEY } from "shared/api/apiMetrics";
import { setup } from "../../index";
import { SchedulerProxy } from "../../src/proxy/scheduler-proxy";
import {
    apiMetricsKey,
    endDate,
    id,
    inventoryPlan,
    lambdaArnConst,
    regionConst,
    scheduleGroupName,
    schedulerRuleArnConst,
    startDate,
    transferPlan
} from "../helper/constants";
import {
    validateCreateOneTimeScheduleCommand,
    validateCreateRecurringScheduleCommand,
    validateDeleteScheduleCommand,
    validateGetScheduleCommand,
    validateListSchedulesCommand,
    validateScheduleCommandBase,
    validateUpdateOneTimeScheduleCommand,
    validateUpdateRecurringScheduleCommand
} from "../helper/validation-factory";

const mock = mockClient(SchedulerClient);

describe("scheduler-proxy", () => {
    beforeEach(() => {
        process.env.REGION = regionConst;
        process.env.LAMBDA_FUNCTION_ARN = lambdaArnConst;
        process.env.SCHEDULER_RULE_ARN = schedulerRuleArnConst;
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = apiMetricsKey;
        process.env.SCHEDULE_GROUP_NAME = scheduleGroupName;
        setup();
        mock.reset();
    });

    test("will construct ok", () => {
        const schedulerProxy = new SchedulerProxy();

        expect(schedulerProxy).toBeDefined();
    });

    test("will get schedule ok", async () => {
        mock.on(GetScheduleCommand).resolves({});

        const schedulerProxy = new SchedulerProxy();
        await schedulerProxy.getSchedule(id);

        const command = mock.commandCalls(GetScheduleCommand)[0].firstArg as GetScheduleCommand;
        validateGetScheduleCommand(command);
    });

    test("will list schedules ok", async () => {
        mock.on(GetScheduleCommand).resolves({});

        const schedulerProxy = new SchedulerProxy();
        await schedulerProxy.listSchedules(id);

        const command = mock.commandCalls(ListSchedulesCommand)[0].firstArg as ListSchedulesCommand;
        validateListSchedulesCommand(command);
    });

    test("will update inventory schedule ok", async () => {
        mock.on(DeleteScheduleCommand).resolves({});
        mock.on(CreateScheduleCommand).resolves({});

        const schedulerProxy = new SchedulerProxy();
        await schedulerProxy.updateRecurringSchedule(inventoryPlan);

        const command = mock.commandCalls(UpdateScheduleCommand)[0].firstArg as UpdateScheduleCommand;
        validateScheduleCommandBase(command);
        validateUpdateRecurringScheduleCommand(command);
    });

    test("will update transfer schedule ok", async () => {
        mock.on(UpdateScheduleCommand).resolves({});

        const schedulerProxy = new SchedulerProxy();
        await schedulerProxy.updateOneTimeSchedule(transferPlan);

        const shipCommand = mock.commandCalls(UpdateScheduleCommand)[0].firstArg as UpdateScheduleCommand;
        validateScheduleCommandBase(shipCommand);
        validateUpdateOneTimeScheduleCommand(shipCommand, startDate);

        const arrivalCommand = mock.commandCalls(UpdateScheduleCommand)[1].firstArg as UpdateScheduleCommand;
        validateScheduleCommandBase(arrivalCommand);
        validateUpdateOneTimeScheduleCommand(arrivalCommand, endDate);
    });

    test("will create inventory schedule ok", async () => {
        mock.on(CreateScheduleCommand).resolves({});

        const schedulerProxy = new SchedulerProxy();
        await schedulerProxy.createRecurringSchedule(inventoryPlan);

        const command = mock.commandCalls(CreateScheduleCommand)[0].firstArg as CreateScheduleCommand;
        validateScheduleCommandBase(command);
        validateCreateRecurringScheduleCommand(command);
    });

    test("will create transfer schedule ok", async () => {
        mock.on(CreateScheduleCommand).resolves({});

        const schedulerProxy = new SchedulerProxy();
        await schedulerProxy.createOneTimeSchedule(transferPlan);

        const shipCommand = mock.commandCalls(CreateScheduleCommand)[0].firstArg as CreateScheduleCommand;
        validateScheduleCommandBase(shipCommand);
        validateCreateOneTimeScheduleCommand(shipCommand, startDate);

        const arrivalCommand = mock.commandCalls(CreateScheduleCommand)[1].firstArg as CreateScheduleCommand;
        validateScheduleCommandBase(arrivalCommand);
        validateCreateOneTimeScheduleCommand(arrivalCommand, endDate);
    });

    test("will delete schedule ok", async () => {
        mock.on(DeleteScheduleCommand).resolves({});

        const schedulerProxy = new SchedulerProxy();
        await schedulerProxy.deleteSchedule(id);

        const command = mock.commandCalls(DeleteScheduleCommand)[0].firstArg as DeleteScheduleCommand;
        validateDeleteScheduleCommand(command, "");
    });
});
