// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect } from "@jest/globals";
import { Item } from "shared/neptune/model/item";
import { amount, SchedulerDetails } from "../util/constants";
import { TransferPlanStatus } from "shared/neptune/model/constants";

export function validateRecurringSchedulerDetails(schedulerDetails: SchedulerDetails, expectedScheduleHour: number) {
    expect(schedulerDetails.scheduleTime).toBe(expectedScheduleHour.toString());
    expect(schedulerDetails.input).toBeDefined();
}

export function validateOnetimeSchedulerDetails(schedulerDetails: SchedulerDetails) {
    expect(schedulerDetails.scheduleTime).toBeDefined();
    expect(schedulerDetails.input).toBeDefined();
}

export function validateInventoryPlanIsExecuted(item: Item) {
    expect(item.amount).toBeDefined();
    expect(item.amount).toBe(amount + amount);
}

export function validateTransferPlanIsExecuted(fromItem: Item, toItem: Item, plan: any, status: TransferPlanStatus) {
    expect(plan.transferPlan.status).toBe(status);
    if (plan.transferPlan.status === TransferPlanStatus.IN_TRANSIT) {
        expect(fromItem.amount).toBe(0);
        expect(toItem.amount).toBe(amount);
    } else {
        expect(fromItem.amount).toBe(0);
        expect(toItem.amount).toBe(amount * 2);
    }
}
