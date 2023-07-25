// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const moment = require("moment");
import { ListSchedulesCommandOutput } from "@aws-sdk/client-scheduler";
import { InventoryPlanType } from "shared/neptune/model/constants";
import { InventoryPlanInput, TransferPlanInput, TransferScheduleType } from "../../src/model/scheduler";

export const id = "22c28695-b242";

export const scheduleGroupName = "TestGroup";

export const startDateEpoch = moment().valueOf();

export const endDateEpoch = moment().add(1, "d").valueOf();

export const startDate = moment(startDateEpoch).toDate();

export const endDate = moment(endDateEpoch).toDate();

export const adjStartDate = moment(startDate).add(-1, "m").toDate();

export const adjEndDate = moment(endDate).add(1, "m").toDate();

export const turnoverHour = 10;

export const dailyRate = 10;

export const amount = 10;

export const sku = "sku";

export const neptuneHostConst = "endpoint-foo-bar";

export const neptunePortConst = "8182";

export const solutionId = "some-id";

export const regionConst = "us-east-1";

export const lambdaArnConst = "lambda-function-arn";

export const schedulerRuleArnConst = "scheduler-rule-arn";

export const apiMetricsKey = JSON.stringify([["AWSSOLUTIONS/SO0234,v1.0.0"]]);

export const createInventoryPlanEvent = {
    id: id,
    op: "ADD",
    key: "label",
    label: "inventory-plan"
};

export const updateInventoryPlanEvent = {
    id: id,
    op: "ADD",
    key: "startDate",
    label: "inventory-plan"
};

export const createTransferPlanEvent = {
    id: id,
    op: "ADD",
    key: "label",
    label: "transfer-plan"
};

export const updateTransferPlanEvent = {
    id: id,
    op: "ADD",
    key: "shipDateTime",
    label: "transfer-plan"
};

export const deletePlanEvent = {
    id: id,
    op: "REMOVE",
    key: "label",
    label: "inventory-plan"
};

export const inventoryPlan: any = {
    id: id,
    planType: InventoryPlanType.MANUFACTURING,
    startDate: startDate,
    endDate: endDate,
    turnoverHour: turnoverHour,
    dailyRate: dailyRate
};

export const transferPlan: any = {
    id: id,
    shipDate: startDate,
    arrivalDate: endDate,
    transferAmount: amount
};

export const inventoryPlanSchedule: InventoryPlanInput = {
    Id: id,
    Type: InventoryPlanType.MANUFACTURING,
    DailyRate: dailyRate
};

export const transferPlanStartSchedule: TransferPlanInput = {
    Id: id,
    Amount: amount,
    Type: TransferScheduleType.SHIP
};

export const transferPlanEndSchedule: TransferPlanInput = {
    Id: id,
    Amount: amount,
    Type: TransferScheduleType.ARRIVAL
};

export const listSchedulesEmptyResponce: ListSchedulesCommandOutput = {
    $metadata: {},
    Schedules: []
};

export const listSchedulesNonEmptyResponce: ListSchedulesCommandOutput = {
    $metadata: {},
    Schedules: [
        {
            Name: id
        }
    ]
};

export const previousInventoryItem: any = {
    id: id,
    amount: amount,
    dateEntered: startDate,
    sku: sku,
    userDefinedFields: ""
};

export const currentInventoryItem: any = {
    id: id,
    amount: amount,
    dateEntered: endDate,
    sku: sku,
    userDefinedFields: ""
};

export const previousTransferItem: any = {
    id: id,
    amount: amount,
    dateEntered: startDate,
    sku: sku,
    userDefinedFields: ""
};

export const currentTransferItem: any = {
    id: id,
    amount: amount,
    dateEntered: endDate,
    sku: sku,
    userDefinedFields: ""
};

export const itemRecord: any = {
    id: id,
    dateFrom: startDate,
    dateTo: startDate,
    fromAmount: amount,
    toAmount: amount,
    planId: id
};

export const edge: any = {
    id: id
};

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
