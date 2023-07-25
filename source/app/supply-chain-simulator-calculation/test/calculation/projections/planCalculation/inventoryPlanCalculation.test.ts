// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LoggerManager } from "../../../../src/util/logger";
import { expect, describe, test } from "@jest/globals";
import { InventoryPlan } from "../../../../src/model/inventoryPlan";
import { InventoryPlanCalculation } from "../../../../src/calculation/projections/planCalculation/inventoryPlanCalculation";
import { FutureDateEdge } from "../../../../src/model/futureDateEdge";

describe("inventory plan calculation", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();
    test("will calculate", () => {
        // Arrange
        const stubbedItemId = "item-id";
        const dateGenerated = new Date();

        const inventoryPlanCalculation = new InventoryPlanCalculation(stubbedItemId, dateGenerated, logger);

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

        const today = new Date("2022-12-14T00:00:00");

        const inventoryPlan: InventoryPlan = {
            startDate: new Date("2022-12-14T00:00:00"),
            endDate: new Date("2022-12-24T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "MANUFACTURING",
            dailyRate: 100
        };

        const inventoryPlan2: InventoryPlan = {
            startDate: new Date("2022-11-02T00:00:00"),
            endDate: new Date("2022-12-17T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "SALES",
            dailyRate: -50
        };

        const inventoryPlan3: InventoryPlan = {
            startDate: new Date("2022-12-13T00:00:00"),
            endDate: new Date("2022-12-15T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "MANUFACTURING",
            dailyRate: 90
        };

        const inventoryPlan4: InventoryPlan = {
            startDate: new Date("2022-11-13T00:00:00"),
            endDate: new Date("2023-01-15T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "MANUFACTURING",
            dailyRate: 15
        };

        const inventoryPlans = [inventoryPlan, inventoryPlan2, inventoryPlan3, inventoryPlan4];

        // Act
        const calculatedProjections = inventoryPlanCalculation.calculateInventoryEndingOnHand(
            today,
            inventoryPlans,
            projections
        );

        // Assert
        expect(calculatedProjections.length).toBe(projections.length);
        expect(calculatedProjections[0].inventoryEndingOnHand).toBe(155);
        expect(calculatedProjections[1].inventoryEndingOnHand).toBe(220);
        expect(calculatedProjections[2].inventoryEndingOnHand).toBe(285);
        expect(calculatedProjections[3].inventoryEndingOnHand).toBe(400);
        expect(calculatedProjections[4].inventoryEndingOnHand).toBe(515);
        expect(calculatedProjections[5].inventoryEndingOnHand).toBe(630);
        expect(calculatedProjections[6].inventoryEndingOnHand).toBe(745);
        expect(calculatedProjections[7].inventoryEndingOnHand).toBe(860);
        expect(calculatedProjections[8].inventoryEndingOnHand).toBe(975);
        expect(calculatedProjections[9].inventoryEndingOnHand).toBe(1090);
    });
});
