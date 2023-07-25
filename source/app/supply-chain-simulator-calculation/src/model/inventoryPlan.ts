// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface InventoryPlan {
    startDate: Date;
    endDate: Date;
    turnoverHour: string;
    planType: string;
    dailyRate: number;
}
