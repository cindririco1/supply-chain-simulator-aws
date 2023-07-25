// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LoggerManager } from "../../src/util/logger";
import { expect, describe, test, jest, afterEach } from "@jest/globals";
import { FutureDateEdge } from "../../src/model/futureDateEdge";
import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { CalculationDataAccess } from "../../src/calculation/calculationDataAccess";
import { DataChange } from "../../src/types/queueMessageType";
import { NeptuneMapType } from "shared/neptune/db/neptune-types";

describe("calculation data access", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();
    const itemId = "some-id";
    const dc: DataChange = {
        id: "5fc8e84d-3aef-4730-9588-458c7fe40b8e",
        key: "amount",
        op: "ADD",
        label: "Item",
        value: { value: "120", dataType: "Int" },
        sqs: {
            messageId: "382d7edc-724d-4236-9438-1cafdd56250a",
            numberOfFailures: 0,
            receiptHandle:
                "AQEB/yu5ZczLxl8kAbYaywhbjDmVVuuOZcCHswv6FdLdks4k2x06UB4ZWAcyWfh8TKE5m/h7VTvzDXwzDxtEO0yt5Dyezsr8riCQ70/xOHNG9883YGZ+kU5UK3zPhC3M2T4fXcdtvbzYq10aQCJC+IWfz9jzKvlLJoziGbAusBlT9RhLcg6eEJrhOp5rcKFnvdYTtpZHVAztUk7tGUztVAzHwzuM+HEVlJNSt3aJErnNrmzR4ZoQKGFKJqxPLfTi1UIn5RW6MsdKypD7XtiaJXKyqvE3InK5ku6GhCgdrwZjNE6UXGRai2Ls85o6DInLChsCYOBca5RoM7XdyddjoY4jdO6YCXXvv74j06mIsnJlsdUboGWNk/XCxUWbwRKLa6fBnbGe2f0iZkH5zXHq4+1gNyeecWCytQ6/lMn/Q3xy8LCjw5h4jsXdn65xsINR8+AHtHYYrq3S0dv/+eaZsZ2UoQ=="
        }
    };
    const expectedItemIdRetrieval = {
        itemId: itemId,
        dataChange: {
            id: "5fc8e84d-3aef-4730-9588-458c7fe40b8e",
            key: "amount",
            op: "ADD",
            label: "Item",
            value: { value: "120", dataType: "Int" },
            sqs: {
                messageId: "382d7edc-724d-4236-9438-1cafdd56250a",
                numberOfFailures: 0,
                receiptHandle:
                    "AQEB/yu5ZczLxl8kAbYaywhbjDmVVuuOZcCHswv6FdLdks4k2x06UB4ZWAcyWfh8TKE5m/h7VTvzDXwzDxtEO0yt5Dyezsr8riCQ70/xOHNG9883YGZ+kU5UK3zPhC3M2T4fXcdtvbzYq10aQCJC+IWfz9jzKvlLJoziGbAusBlT9RhLcg6eEJrhOp5rcKFnvdYTtpZHVAztUk7tGUztVAzHwzuM+HEVlJNSt3aJErnNrmzR4ZoQKGFKJqxPLfTi1UIn5RW6MsdKypD7XtiaJXKyqvE3InK5ku6GhCgdrwZjNE6UXGRai2Ls85o6DInLChsCYOBca5RoM7XdyddjoY4jdO6YCXXvv74j06mIsnJlsdUboGWNk/XCxUWbwRKLa6fBnbGe2f0iZkH5zXHq4+1gNyeecWCytQ6/lMn/Q3xy8LCjw5h4jsXdn65xsINR8+AHtHYYrq3S0dv/+eaZsZ2UoQ=="
            }
        }
    };
    test("will handle failures while gettting item by id", async () => {
        // Arrange
        const db = NeptuneDB.prototype;

        const dateEntered = new Date("2022-12-01");

        const itemV = new Map<string, NeptuneMapType>();
        itemV.set("id", itemId);
        itemV.set("sku", "some-sku");
        itemV.set("amount", 100);
        itemV.set("dateEntered", dateEntered);
        itemV.set("userDefinedFields", "{}");
        db.getById = jest.fn().mockImplementationOnce(() => {
            return undefined;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const calculationDataAccess = new CalculationDataAccess(db, logger);

        // Act
        let errorThrown = false;
        try {
            const item = await calculationDataAccess.getItemById("some-id");
        } catch (e) {
            errorThrown = true;
        }

        // Assert
        expect(errorThrown).toBe(true);
    });

    test("will handle failures on save projections", async () => {
        // Arrange
        const db = NeptuneDB.prototype;

        // escript-eslint/no-explicit-any
        db.deleteEdge = jest.fn() as any;

        // escript-eslint/no-explicit-any
        db.commitTransaction = jest.fn() as any;

        // escript-eslint/no-explicit-any
        db.rollbackTransaction = jest.fn() as any;

        db.createEdge = jest.fn().mockImplementationOnce(() => {
            throw new Error();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const calculationDataAccess = new CalculationDataAccess(db, logger);
        const dateGenerated = new Date("2022-12-01");
        const projections: FutureDateEdge[] = [
            {
                id: "projection1",
                itemId: "stubbedItemId",
                futureDateId: "1",
                inventoryEndingOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                inventoryBeginningOnHand: 0,
                demandPlanned: 0,
                dateGenerated: dateGenerated
            }
        ];

        // Act
        let errorThrown = false;
        try {
            await calculationDataAccess.saveProjections(projections);
        } catch (e) {
            errorThrown = true;
        }

        // Assert
        expect(errorThrown).toBe(true);
    });

    test("will handle failures getting inventory plans by item id", async () => {
        // Arrange
        const db = NeptuneDB.prototype;
        const startDate = new Date("2022-12-01");
        const endDate = new Date("2022-12-10");

        const inventoryPlan = new Map<string, NeptuneMapType>();
        inventoryPlan.set("startDate", startDate);
        inventoryPlan.set("endDate", endDate);
        inventoryPlan.set("turnoverHour", 10);
        inventoryPlan.set("planType", "MANUFACTURING");
        inventoryPlan.set("dailyRate", 10);
        db.getAllConnected = jest.fn().mockImplementationOnce(() => {
            throw new Error();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const calculationDataAccess = new CalculationDataAccess(db, logger);

        // Act
        let errorThrown = false;
        try {
            const inventoryPlans = await calculationDataAccess.getInventoryPlansForItem("some-id");
        } catch (e) {
            errorThrown = true;
        }

        // Assert
        expect(errorThrown).toBe(true);
    });

    test("will handle failures getting item id from transfer plan takes", async () => {
        // Arrange
        const db = NeptuneDB.prototype;
        const dateEntered = new Date("2022-12-01");

        const item = new Map<string, NeptuneMapType>();
        item.set("id", itemId);
        item.set("sku", "some-sku");
        item.set("amount", 100);
        item.set("dateEntered", dateEntered);
        item.set("userDefinedFields", "{}");
        db.getOutVertex = jest.fn().mockImplementationOnce(() => {
            throw new Error("My error");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const calculationDataAccess = new CalculationDataAccess(db, logger);

        // Act
        const response = await calculationDataAccess.getItemIdFromTransferPlanTakes(dc);

        // Assert
        expect(response.dataChange.errorMsg).toEqual("Could not get item id from transfer plan takes: Error: My error");

        // reset mock manually
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.getAllConnected_k_hop = jest.fn().mockClear() as any;
    });
});
