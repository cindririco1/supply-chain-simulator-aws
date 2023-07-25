// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeLabel, InventoryPlanType, VertexLabel } from "neptune/model/constants";
import { InventoryPlan } from "neptune/model/inventory-plan";
import { PutInventoryPlanApi } from "../../../../api/inventory-plan/put/put-inventory-plan-api";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("putInventoryPlanApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PutInventoryPlanApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should call database with proper values with same ItemId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const inventoryPlanId = "test_inventory_plan_id";
        const currentItemId = "test_item_id";
        const updateditemId = "test_item_id";
        const inventoryPlan: InventoryPlan = {
            id: inventoryPlanId,
            turnoverHour: 5,
            dailyRate: 1000
        };

        const api = new PutInventoryPlanApi(db);

        const mockGetVertex = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return { id: inventoryPlanId, planType: "sales" };
        }) as any);

        const mockUpdateVertex = (db.updateVertex = jest.fn().mockImplementationOnce(async () => {
            return { id: inventoryPlanId, response: "mockVertexResponse" };
        }) as any);

        const mockgetCurrentItemId = (api.getCurrentItemId = jest.fn().mockImplementationOnce(async () => {
            return currentItemId;
        }) as any);

        // act
        const result = await api.execute(
            "",
            `{ "itemId": "${updateditemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`,
            {}
        );

        // assert
        expect(mockGetVertex).toHaveBeenCalledTimes(1);
        expect(mockGetVertex).toHaveBeenCalledWith(VertexLabel.INVENTORY_PLAN, inventoryPlanId);

        expect(mockUpdateVertex).toHaveBeenCalledTimes(1);
        expect(mockUpdateVertex).toHaveBeenCalledWith(
            VertexLabel.INVENTORY_PLAN,
            expect.objectContaining({
                turnoverHour: inventoryPlan.turnoverHour,
                dailyRate: inventoryPlan.dailyRate,
                itemId: currentItemId
            })
        );

        expect(mockgetCurrentItemId).toHaveBeenCalledTimes(1);
        expect(JSON.parse(result.body)).toEqual({
            inventoryPlan: { id: inventoryPlanId, response: "mockVertexResponse" }
        });
    });

    it("should call database with proper values with different ItemId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const inventoryPlanId = "test_inventory_plan_id";
        const currentItemId = "test_current_item_id";
        const updatedItemId = "test_updated_item_id";
        const inventoryPlan: InventoryPlan = {
            id: inventoryPlanId,
            turnoverHour: 5,
            dailyRate: 1000
        };

        const api = new PutInventoryPlanApi(db);

        const mockGetVertex = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return { id: inventoryPlanId, planType: "sales" };
        }) as any);

        const mockUpdateVertex = (db.updateVertex = jest.fn().mockImplementationOnce(async () => {
            return { id: inventoryPlanId, response: "mockVertexResponse" };
        }) as any);

        const mockDeleteEdge = (db.deleteEdge = jest.fn().mockImplementationOnce(async () => {
            return "mockDeleteEdgeResponse";
        }) as any);

        const mockCreateEdge = (db.createEdge = jest.fn().mockImplementationOnce(async () => {
            return "mockCreateEdgeResponse";
        }) as any);

        const mockgetCurrentItemId = (api.getCurrentItemId = jest.fn().mockImplementationOnce(async () => {
            return currentItemId;
        }) as any);

        // act
        const result = await api.execute(
            "",
            `{ "itemId": "${updatedItemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`,
            {}
        );

        // assert
        expect(mockGetVertex).toHaveBeenCalledTimes(1);
        expect(mockGetVertex).toHaveBeenCalledWith(VertexLabel.INVENTORY_PLAN, inventoryPlanId);

        expect(mockUpdateVertex).toHaveBeenCalledTimes(1);
        expect(mockUpdateVertex).toHaveBeenCalledWith(
            VertexLabel.INVENTORY_PLAN,
            expect.objectContaining({
                turnoverHour: inventoryPlan.turnoverHour,
                dailyRate: inventoryPlan.dailyRate,
                itemId: updatedItemId
            })
        );

        expect(mockgetCurrentItemId).toHaveBeenCalledTimes(1);

        expect(mockDeleteEdge).toHaveBeenCalledTimes(1);
        expect(mockDeleteEdge).toHaveBeenCalledWith(
            VertexLabel.INVENTORY_PLAN,
            inventoryPlanId,
            VertexLabel.ITEM,
            currentItemId,
            EdgeLabel.UPDATES
        );

        expect(mockCreateEdge).toHaveBeenCalledTimes(1);
        expect(mockCreateEdge).toHaveBeenCalledWith(
            VertexLabel.INVENTORY_PLAN,
            inventoryPlanId,
            VertexLabel.ITEM,
            updatedItemId,
            EdgeLabel.UPDATES,
            {}
        );

        expect(JSON.parse(result.body)).toEqual({
            inventoryPlan: { id: inventoryPlanId, response: "mockVertexResponse" },
            edge: "mockCreateEdgeResponse"
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutInventoryPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if body is missing arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutInventoryPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", `{"inventoryPlan":{}}`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if inventoryPlan has invalid type", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutInventoryPlanApi(db);
        const inventoryPlan: InventoryPlan = {
            id: "test_id",
            startDate: new Date(),
            endDate: new Date(),
            turnoverHour: 5,
            planType: "not_a_real_type" as InventoryPlanType,
            dailyRate: 1000
        };

        // act/assert
        await expect(async () => {
            await api.execute(
                "",
                `{ "itemId": "test_item_id", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`,
                {}
            );
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutInventoryPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });

    it("Should throw error when plan type is being updated", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        db.getById = jest.fn().mockImplementationOnce(async () => {
            return { id: "test_id", planType: "sales" };
        }) as any;
        const api = new PutInventoryPlanApi(db);
        const inventoryPlan: InventoryPlan = {
            id: "test_id",
            startDate: new Date(),
            endDate: new Date(),
            turnoverHour: 5,
            planType: "manufacturing" as InventoryPlanType,
            dailyRate: 1000
        };

        // act
        const response = await api.execute(
            "",
            `{ "itemId": "test_item_id", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`,
            {}
        );

        // assert
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({
            message: "Modifying Plan Type is not allowed"
        });
    });

    it("Should allow update if plan type is not being updated", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const inventoryPlanId = "test_inventory_plan_id";
        const currentItemId = "test_item_id";
        const inventoryPlan: InventoryPlan = {
            id: inventoryPlanId,
            turnoverHour: 5,
            dailyRate: 1000,
            planType: InventoryPlanType.SALES
        };

        const api = new PutInventoryPlanApi(db);

        const mockGetVertex = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return { id: inventoryPlanId, planType: "sales" };
        }) as any);
        const mockUpdateVertex = (db.updateVertex = jest.fn().mockImplementationOnce(async () => {
            return { id: inventoryPlanId, response: "mockVertexResponse" };
        }) as any);
        api.getCurrentItemId = jest.fn().mockImplementationOnce(async () => {
            return currentItemId;
        }) as any;

        // act
        const result = await api.execute(
            "",
            `{ "itemId": "${currentItemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`,
            {}
        );

        // assert
        expect(mockGetVertex).toHaveBeenCalledTimes(1);
        expect(mockGetVertex).toHaveBeenCalledWith(VertexLabel.INVENTORY_PLAN, inventoryPlanId);

        expect(mockUpdateVertex).toHaveBeenCalledTimes(1);
        expect(mockUpdateVertex).toHaveBeenCalledWith(
            VertexLabel.INVENTORY_PLAN,
            expect.objectContaining({
                turnoverHour: inventoryPlan.turnoverHour,
                planType: inventoryPlan.planType,
                dailyRate: inventoryPlan.dailyRate,
                itemId: currentItemId
            })
        );
    });

    it("Inventory plan API | failure | rollback changes", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const inventoryPlanId = "test_inventory_plan_id";
        const currentItemId = "test_item_id";
        const inventoryPlan: InventoryPlan = {
            id: inventoryPlanId,
            turnoverHour: 5,
            dailyRate: 1000,
            planType: InventoryPlanType.SALES
        };

        const api = new PutInventoryPlanApi(db);

        const mockGetVertex = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return { id: inventoryPlanId, planType: "sales", itemId: "test_item_id" };
        }) as any);
        const mockUpdateVertex = (db.updateVertex = jest.fn().mockImplementationOnce(async () => {
            return { id: inventoryPlanId, response: "mockVertexResponse" };
        }) as any);
        api.getCurrentItemId = jest.fn().mockImplementationOnce(async () => {
            return "test_item_id_2";
        }) as any;
        const mockDeleteEdge = (db.deleteEdge = jest.fn() as any);
        const mockCreateEdge = (db.createEdge = jest.fn().mockImplementationOnce(async () => {
            throw new Error("mock error");
        }) as any);

        // act
        let errorThrown = false;
        try {
            const result = await api.execute(
                "",
                `{ "itemId": "${currentItemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`,
                {}
            );
        } catch (e) {
            errorThrown = true;
        }

        // assert
        expect(errorThrown).toBeFalsy();
        expect(mockGetVertex).toHaveBeenCalledTimes(1);
        expect(mockGetVertex).toHaveBeenCalledWith(VertexLabel.INVENTORY_PLAN, inventoryPlanId);

        // once for original, twice to reset
        expect(mockUpdateVertex).toHaveBeenCalledTimes(2);
        expect(mockCreateEdge).toHaveBeenCalledTimes(2);
    });

    it("Test put inventory-plan with dailyRate <= 0 | failure | dailyRate <= 0", async () => {
        //  arrange
        const db = NeptuneDB.prototype;
        const inventoryPlanId = "test_inventory_plan_id";
        const currentItemId = "test_item_id";
        const updateditemId = "test_item_id";
        const inventoryPlan: InventoryPlan = {
            id: inventoryPlanId,
            turnoverHour: 5,
            dailyRate: -1000
        };
        const api = new PutInventoryPlanApi(db);

        //  act/assert
        //  Test negative daily rate
        await expect(async () => {
            const result = await api.execute(
                "",
                `{ "itemId": "${updateditemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`,
                {}
            );
        }).rejects.toThrowError("Unexpected/Missing properties in body");

        //  Test dailyRate = 0 edge case
        inventoryPlan.dailyRate = 0;

        await expect(async () => {
            const result = await api.execute(
                "",
                `{ "itemId": "${updateditemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`,
                {}
            );
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });
});
