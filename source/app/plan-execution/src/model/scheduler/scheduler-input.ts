// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InventoryPlanType } from "shared/neptune/model/constants";

export enum TransferScheduleType {
    SHIP = "ship",
    ARRIVAL = "arrival"
}

export interface SchedulerInput {
    Id: string;
}

export interface InventoryPlanInput extends SchedulerInput {
    Type: InventoryPlanType;
    DailyRate: number;
}

export interface TransferPlanInput extends SchedulerInput {
    Amount: number;
    Type: TransferScheduleType;
}
