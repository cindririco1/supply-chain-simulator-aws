// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FlexibleTimeWindowMode, ScheduleState } from "@aws-sdk/client-scheduler";
import { convertDate } from "./time-util";
import { InventoryPlanInput, TransferPlanInput, TransferScheduleType } from "../model/scheduler";
import { Vertex } from "shared/neptune/model/vertex";
import { InventoryPlan } from "shared/neptune/model/inventory-plan";
import { TransferPlan } from "shared/neptune/model/transfer-plan";
/* eslint-disable */
const moment = require("moment");

const MAX_SCHEDULE_NAME_LENGTH = 512;

/**
 * Default EventBridge schedule rule properties for creation or update.
 */
export function getDefaultScheduleProps(id: string) {
    return {
        FlexibleTimeWindow: {
            Mode: FlexibleTimeWindowMode.OFF
        },
        Name: id,
        GroupName: scheduleGroupName,
        Description: `EventBridge schedule rule for vertex: ${id}`,
        State: ScheduleState.ENABLED,
        ScheduleExpressionTimezone: "UTC"
    };
}

/**
 * Gets schedule group name from env var
 * @returns schedule group name
 */
export function getScheduleGroupName(): string {
    const scheduleGroupName = process.env.SCHEDULE_GROUP_NAME;
    if (scheduleGroupName == undefined) {
        throw new Error("Must defined SCHEDULE_GROUP_NAME env var");
    }
    return scheduleGroupName;
}

/**
 * Get time frame to specify when the EventBridge schedule rule will be executed.
 */
export function getTimeFrame(inventoryPlan: InventoryPlan) {
    // adjusting minute times to be inclusive of startdate and enddate
    const startDate = moment.utc(inventoryPlan.startDate).add(-1, "m").toDate() as Date;
    const endDate = moment.utc(inventoryPlan.endDate).add(inventoryPlan.turnoverHour, "h").add(1, "m").toDate() as Date;

    // Inventory Plan
    return {
        ScheduleExpression: `cron(0 ${inventoryPlan.turnoverHour} * * ? *)`,
        StartDate: startDate,
        EndDate: endDate
    };
}

/**
 * Get customized input json while triggering the target (Lambda).
 *
 * Note: parameter names must be in PascalCase.
 */
export function getInputJson(vertex: Vertex, type?: TransferScheduleType): string {
    if ("dailyRate" in vertex) {
        // Inventory Plan
        const plan = vertex as InventoryPlan;
        const input: InventoryPlanInput = {
            Id: plan.id!,
            Type: plan.planType!,
            DailyRate: plan.dailyRate!
        };
        return JSON.stringify(input);
    } else {
        // Transfer Plan
        const plan = vertex as TransferPlan;
        const input: TransferPlanInput = {
            Id: plan.id!,
            Amount: plan.transferAmount!,
            Type: type!
        };
        return JSON.stringify(input);
    }
}

/**
 * Get Schedule input for Transfer plan, the input could be used for both Schedule creation and update.
 */
export function getRecurringScheduleInput(inventoryPlan: InventoryPlan) {
    const id = inventoryPlan.id!;

    return {
        ...getDefaultScheduleProps(id),
        ...getTimeFrame(inventoryPlan),
        Target: {
            Arn: lambdaArn,
            RoleArn: schedulerRuleArn,
            Input: getInputJson(inventoryPlan)
        }
    };
}

/**
 * Get Schedule input for Inventory plan, the input could be used for both Schedule creation and update.
 */
export function getOneTimeScheduleInputs(transferPlan: TransferPlan) {
    const id = transferPlan.id!;

    const shipCommand = {
        ...getDefaultScheduleProps(id),
        Target: {
            Arn: lambdaArn,
            RoleArn: schedulerRuleArn,
            Input: getInputJson(transferPlan, TransferScheduleType.SHIP)
        },
        // at expression - at(yyyy-mm-ddThh:mm:ss)
        ScheduleExpression: `at(${convertDate(transferPlan.shipDate!)})`,
        Name: id + "-" + TransferScheduleType.SHIP,
        GroupName: scheduleGroupName
    };

    const arrivalCommand = {
        ...getDefaultScheduleProps(id),
        Target: {
            Arn: lambdaArn,
            RoleArn: schedulerRuleArn,
            Input: getInputJson(transferPlan, TransferScheduleType.ARRIVAL)
        },
        // at expression - at(yyyy-mm-ddThh:mm:ss)
        ScheduleExpression: `at(${convertDate(transferPlan.arrivalDate!)})`,
        Name: id + "-" + TransferScheduleType.ARRIVAL,
        GroupName: scheduleGroupName
    };

    return [shipCommand, arrivalCommand];
}
