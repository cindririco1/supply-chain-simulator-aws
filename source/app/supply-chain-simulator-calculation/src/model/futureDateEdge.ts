// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface FutureDateEdge {
    id?: string;
    itemId: string;
    futureDateId: string;
    inventoryEndingOnHand: number;
    supplyInTransit: number;
    supplyPlanned: number;
    inventoryBeginningOnHand: number;
    demandPlanned: number;
    dateGenerated: Date;
}
