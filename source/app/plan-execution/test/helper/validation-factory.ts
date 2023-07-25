// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    CreateScheduleCommand,
    DeleteScheduleCommand,
    FlexibleTimeWindowMode,
    GetScheduleCommand,
    ListSchedulesCommand,
    ScheduleState,
    UpdateScheduleCommand
} from "@aws-sdk/client-scheduler";
import { expect } from "@jest/globals";
import {
    adjEndDate,
    adjStartDate,
    endDate,
    id,
    lambdaArnConst,
    scheduleGroupName,
    schedulerRuleArnConst,
    startDate,
    turnoverHour
} from "./constants";
import { convertDate } from "../../src/util/time-util";
/* eslint-disable */
const moment = require("moment");

export function validateGetScheduleCommand(command: GetScheduleCommand) {
    expect(command.input.Name).toBe(id);
    expect(command.input.GroupName).toBe(scheduleGroupName);
}

export function validateListSchedulesCommand(command: ListSchedulesCommand) {
    expect(command.input.NamePrefix).toBe(id);
    expect(command.input.GroupName).toBe(scheduleGroupName);
}

export function validateScheduleCommandBase(command: CreateScheduleCommand | UpdateScheduleCommand) {
    expect(command.input.FlexibleTimeWindow?.Mode).toBe(FlexibleTimeWindowMode.OFF);
    expect(command.input.Description).toBe(`EventBridge schedule rule for vertex: ${id}`);
    expect(command.input.State).toBe(ScheduleState.ENABLED);
    expect(command.input.ScheduleExpressionTimezone).toBe("UTC");
    expect(command.input.Target?.Arn).toBe(lambdaArnConst);
    expect(command.input.Target?.RoleArn).toBe(schedulerRuleArnConst);
}

export function validateUpdateRecurringScheduleCommand(command: UpdateScheduleCommand) {
    const adjEndDateWithHours = moment(adjEndDate).add(turnoverHour, "h").toDate();
    expect(command.input.ScheduleExpression).toBe(`cron(0 ${turnoverHour} * * ? *)`);
    expect(command.input.StartDate).toStrictEqual(adjStartDate);
    expect(command.input.EndDate).toStrictEqual(adjEndDateWithHours);
}

export function validateUpdateOneTimeScheduleCommand(command: UpdateScheduleCommand, date: Date) {
    expect(command.input.ScheduleExpression).toStrictEqual(`at(${convertDate(date)})`);
}

export function validateCreateRecurringScheduleCommand(command: CreateScheduleCommand) {
    const adjEndDateWithHours = moment(adjEndDate).add(turnoverHour, "h").toDate();
    expect(command.input.ScheduleExpression).toBe(`cron(0 ${turnoverHour} * * ? *)`);
    expect(command.input.StartDate).toStrictEqual(adjStartDate);
    expect(command.input.EndDate).toStrictEqual(adjEndDateWithHours);
}

export function validateCreateOneTimeScheduleCommand(command: CreateScheduleCommand, date: Date) {
    expect(command.input.ScheduleExpression).toStrictEqual(`at(${convertDate(date)})`);
}

export function validateDeleteScheduleCommand(command: DeleteScheduleCommand, suffix: string) {
    expect(command.input.Name).toBe(id + suffix);
    expect(command.input.GroupName).toBe(scheduleGroupName);
}
