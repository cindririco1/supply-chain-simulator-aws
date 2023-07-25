// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LoggerManager } from "../../src/util/logger";
import { expect, describe, test, jest } from "@jest/globals";
import { ViolationDataAccess } from "../../src/calculation/violations/violationDataAccess";
import { ViolationHandler } from "../../src/calculation/violations/violationHandler";
import { FutureDateEdge } from "../../src/model/futureDateEdge";
import { Violation } from "../../src/model/violation";

describe("violation handler", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();
    test("will handle violations", async () => {
        // Arrange
        const violationDataAccess = ViolationDataAccess.prototype;
        const rule = {
            id: "some-id",
            name: "default",
            minAllowed: 0
        };
        const expectedRule = {
            name: "default",
            minAllowed: 0
        };

        violationDataAccess.getRules = jest.fn().mockImplementationOnce(() => {
            return [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violationDataAccess.deleteAllRules = jest.fn() as any;

        violationDataAccess.insertRule = jest.fn().mockImplementationOnce(() => {
            return rule;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violationDataAccess.deleteExistingViolations = jest.fn() as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violationDataAccess.createViolation = jest.fn() as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        violationDataAccess.removeViolations = jest.fn() as any;

        const stubbedItemId = "stubbed-item-id";
        const dateGenerated = new Date("2022-12-01");

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
                inventoryEndingOnHand: -10,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            }
        ];

        const exceptionOccurring = new Date();
        exceptionOccurring.setHours(0);
        exceptionOccurring.setMinutes(0);
        exceptionOccurring.setSeconds(0);
        exceptionOccurring.setMilliseconds(0);
        exceptionOccurring.setDate(exceptionOccurring.getDate() + 9);
        const violation: Violation = {
            itemId: "stubbed-item-id",
            ruleId: "some-id",
            exceptionOccuring: exceptionOccurring
        };

        const violationHandler = new ViolationHandler(violationDataAccess, logger);

        const itemId = "test-item-id";

        // Act
        await violationHandler.handleViolations(itemId, projections);

        // Assert
        expect(violationDataAccess.getRules).toHaveBeenCalled();
        expect(violationDataAccess.deleteAllRules).toHaveBeenCalled();
        expect(violationDataAccess.deleteExistingViolations).toHaveBeenCalled();
        expect(violationDataAccess.insertRule).toHaveBeenCalledWith(expectedRule);
        expect(violationDataAccess.createViolation).toHaveBeenCalledWith(violation);
        expect(violationDataAccess.removeViolations).toHaveBeenCalledWith(itemId);
    });
});
