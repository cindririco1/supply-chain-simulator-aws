// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import moment = require("moment");
import { CustomField, CustomFieldType } from "shared/neptune/model/custom-field";

export const startDateEpoch = moment.utc().add(1, "d").valueOf();

export const endDateEpoch = moment.utc().add(2, "d").valueOf();

export const startDate = moment.utc(startDateEpoch).toDate();

export const endDate = moment.utc(endDateEpoch).toDate();

export const turnoverHour = (startDate.getHours() + 1) % 24; // hour from 0 to 23

export const updatedTurnoverHour = (startDate.getHours() + 5) % 24; // hour from 0 to 23

export const dailyRate = 10;

export const amount = 10;

export const userDefinedFields = `{}`;

export const leadTime = "5";

export const updatedLeadTime = "7";

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export interface InventoryPlanSeederResponse {
    locationId: string;
    itemId: string;
    planId: string;
}

export interface TransferPlanSeederResponse {
    fromLocationId: string;
    toLocationId: string;
    fromItemId: string;
    toItemId: string;
    planId: string;
}

export interface SchedulerDetails {
    scheduleTime: string;
    input: string;
}

export const customField: CustomField = {
    fieldName: "Location Zip Code",
    fieldType: CustomFieldType.NUMBER
};
