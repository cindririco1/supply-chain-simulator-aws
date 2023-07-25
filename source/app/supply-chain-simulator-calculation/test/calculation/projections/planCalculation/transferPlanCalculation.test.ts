// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LoggerManager } from "../../../../src/util/logger";
import { expect, describe, test } from "@jest/globals";
import { TransferPlan } from "../../../../src/model/transferPlan";
import { FutureDateEdge } from "../../../../src/model/futureDateEdge";
import { TransferPlanCalculation } from "../../../../src/calculation/projections/planCalculation/transferPlanCalculation";

describe("transfer plan calculation", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();
    test("will calculate", () => {
        // Arrange
        const stubbedItemId = "item-id";
        const dateGenerated = new Date();

        const transferPlanCalculation = new TransferPlanCalculation(stubbedItemId, dateGenerated, 30, logger);

        const projections: FutureDateEdge[] = [
            {
                id: "projection1",
                itemId: stubbedItemId,
                futureDateId: "1",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            },
            {
                id: "projection2",
                itemId: stubbedItemId,
                futureDateId: "2",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            },
            {
                id: "projection3",
                itemId: stubbedItemId,
                futureDateId: "3",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            },
            {
                id: "projection4",
                itemId: stubbedItemId,
                futureDateId: "4",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            },
            {
                id: "projection5",
                itemId: stubbedItemId,
                futureDateId: "5",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            },
            {
                id: "projection6",
                itemId: stubbedItemId,
                futureDateId: "6",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            },
            {
                id: "projection7",
                itemId: stubbedItemId,
                futureDateId: "7",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            },
            {
                id: "projection8",
                itemId: stubbedItemId,
                futureDateId: "8",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            },
            {
                id: "projection9",
                itemId: stubbedItemId,
                futureDateId: "9",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            },
            {
                id: "projection10",
                itemId: stubbedItemId,
                futureDateId: "10",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            }
        ];

        const today = new Date("2022-12-12T00:00:00");

        const transferPlan: TransferPlan = {
            shipDate: new Date("2022-12-13T00:00:00"),
            arrivalDate: new Date("2023-01-01T00:00:00"),
            transferringFrom: true,
            transferAmount: 200
        };

        const transferPlan2: TransferPlan = {
            shipDate: new Date("2022-12-01T00:00:00"),
            arrivalDate: new Date("2022-12-20T00:00:00"),
            transferringFrom: false,
            transferAmount: 176
        };

        const transferPlan3: TransferPlan = {
            shipDate: new Date("2022-11-01T00:00:00"),
            arrivalDate: new Date("2023-01-14T00:00:00"),
            transferringFrom: false,
            transferAmount: 400
        };

        const transferPlans = [transferPlan, transferPlan2, transferPlan3];

        // Act
        const calculatedProjections = transferPlanCalculation.analyzeTransferPlans(today, transferPlans, projections);

        // Assert
        expect(calculatedProjections.length).toBe(projections.length);
        expect(calculatedProjections[0].inventoryEndingOnHand).toBe(-200);
        expect(calculatedProjections[0].demandPlanned).toBe(200);
        expect(calculatedProjections[1].supplyInTransit).toBe(576);
        expect(calculatedProjections[7].supplyPlanned).toBe(176);
    });
});
