// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, describe, test, beforeEach } from "@jest/globals";
import {
    amount,
    dailyRate,
    endDate,
    inventoryPlan,
    id,
    lambdaArnConst,
    regionConst,
    schedulerRuleArnConst,
    startDate,
    adjStartDate,
    adjEndDate,
    transferPlan,
    scheduleGroupName
} from "../helper/constants";
import {
    getDefaultScheduleProps,
    getInputJson,
    getOneTimeScheduleInputs,
    getRecurringScheduleInput,
    getTimeFrame
} from "../../src/util/scheduler-util";
import { FlexibleTimeWindowMode, ScheduleState, UpdateScheduleCommand } from "@aws-sdk/client-scheduler";
import {
    validateScheduleCommandBase,
    validateUpdateOneTimeScheduleCommand,
    validateUpdateRecurringScheduleCommand
} from "../helper/validation-factory";
import { setup } from "../../index";
import { InventoryPlanType } from "shared/neptune/model/constants";
/* eslint-disable */
const moment = require("moment");

describe("schedule-util", () => {
    beforeEach(() => {
        process.env.REGION = regionConst;
        process.env.LAMBDA_FUNCTION_ARN = lambdaArnConst;
        process.env.SCHEDULER_RULE_ARN = schedulerRuleArnConst;
        process.env.SCHEDULE_GROUP_NAME = scheduleGroupName;
        setup();
    });

    test("will return default schedule properties", () => {
        const props = getDefaultScheduleProps(id);
        expect(props.FlexibleTimeWindow.Mode).toBe(FlexibleTimeWindowMode.OFF);
        expect(props.Name).toBe(id);
        expect(props.GroupName).toBe(scheduleGroupName);
        expect(props.Description).toBe("EventBridge schedule rule for vertex: 22c28695-b242");
        expect(props.State).toBe(ScheduleState.ENABLED);
        expect(props.ScheduleExpressionTimezone).toBe("UTC");
    });

    test("will return correct time frame", () => {
        const props = getTimeFrame(inventoryPlan);
        const adjEndDateWithHours = moment(adjEndDate).add(inventoryPlan.turnoverHour, "h").toDate();

        expect(props.ScheduleExpression).toBe("cron(0 10 * * ? *)");
        expect(props.StartDate).toStrictEqual(adjStartDate);
        expect(props.EndDate).toStrictEqual(adjEndDateWithHours);
    });

    test("will return correct input json for inventory plan", () => {
        const inputJson = getInputJson(inventoryPlan);
        const input = JSON.parse(inputJson);
        expect(input.Id).toBe(id);
        expect(input.Type).toBe(InventoryPlanType.MANUFACTURING);
        expect(input.DailyRate).toBe(dailyRate);
    });

    test("will return correct time frame for transfer plan", () => {
        const inputJson = getInputJson(transferPlan);
        const input = JSON.parse(inputJson);
        expect(input.Id).toBe(id);
        expect(input.Amount).toBe(amount);
    });

    test("will return schedule input for inventory plan", () => {
        const command = getRecurringScheduleInput(inventoryPlan);
        const commandInput = new UpdateScheduleCommand(command);

        validateScheduleCommandBase(commandInput);
        validateUpdateRecurringScheduleCommand(commandInput);
    });

    test("will return schedule input for trasfer plan", () => {
        const commands = getOneTimeScheduleInputs(transferPlan);
        const shipCommand = commands[0];
        const arrivalCommand = commands[1];
        const shipCommandInput = new UpdateScheduleCommand(shipCommand);
        const arrivalCommandInput = new UpdateScheduleCommand(arrivalCommand);

        validateScheduleCommandBase(shipCommandInput);
        validateUpdateOneTimeScheduleCommand(shipCommandInput, startDate);

        validateScheduleCommandBase(arrivalCommandInput);
        validateUpdateOneTimeScheduleCommand(arrivalCommandInput, endDate);
    });
});
