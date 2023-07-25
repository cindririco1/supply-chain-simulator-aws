// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeLabel, InventoryPlanType, VertexLabel } from "neptune/model/constants";
import { InventoryPlan } from "neptune/model/inventory-plan";
import { PostInventoryPlanApi } from "../../../../api/inventory-plan/post/post-inventory-plan-api";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("postInventoryPlanApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PostInventoryPlanApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should call database with proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const inventoryPlanId = "test_item_id";
        const itemId = "test_item_id";
        const inventoryPlan: InventoryPlan = {
            startDate: new Date(),
            endDate: new Date(),
            turnoverHour: 5,
            planType: InventoryPlanType.MANUFACTURING,
            dailyRate: 1000
        };

        const mockCreateVertex = (db.createVertex = jest.fn().mockImplementationOnce(async () => {
            return { id: inventoryPlanId, response: "mockVertexResponse" };
        }) as any);
        const mockCreateEdge = (db.createEdge = jest.fn().mockImplementationOnce(async () => {
            return "mockEdgeResponse";
        }) as any);
        const api = new PostInventoryPlanApi(db);

        // act
        const result = await api.execute(
            "",
            `{ "itemId": "${itemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`,
            {}
        );

        // assert
        expect(mockCreateVertex).toHaveBeenCalledTimes(1);
        expect(mockCreateVertex).toHaveBeenCalledWith(
            VertexLabel.INVENTORY_PLAN,
            expect.objectContaining({
                turnoverHour: inventoryPlan.turnoverHour,
                planType: inventoryPlan.planType,
                dailyRate: inventoryPlan.dailyRate,
                itemId: itemId
            })
        );

        expect(mockCreateEdge).toHaveBeenCalledTimes(1);
        expect(mockCreateEdge).toHaveBeenCalledWith(
            VertexLabel.INVENTORY_PLAN,
            inventoryPlanId,
            VertexLabel.ITEM,
            itemId,
            EdgeLabel.UPDATES,
            {}
        );
        expect(JSON.parse(result.body)).toEqual({
            inventoryPlan: { id: inventoryPlanId, response: "mockVertexResponse" },
            edge: "mockEdgeResponse"
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostInventoryPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if inventoryPlan is missing arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostInventoryPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", `{ "itemId":"testId", "inventoryPlan": {"turnoverHour": 5, "dailyRate": 1000}}`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if inventoryPlan has invalid type", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostInventoryPlanApi(db);
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

    it("should throw if itemId is not present", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostInventoryPlanApi(db);
        const inventoryPlan: InventoryPlan = {
            id: "test_id",
            startDate: new Date(),
            endDate: new Date(),
            turnoverHour: 5,
            planType: InventoryPlanType.MANUFACTURING,
            dailyRate: 1000
        };
        // act/assert
        await expect(async () => {
            await api.execute("", `{"inventoryPlan": ${JSON.stringify(inventoryPlan)}}`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostInventoryPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });

    it("Test post inventory-plan with dailyRate <= 0 | failure | dailyRate <= 0", async () => {
        //  arrange
        const db = NeptuneDB.prototype;
        const api = new PostInventoryPlanApi(db);
        const inventoryPlanId = "test_item_id";
        const itemId = "test_item_id";
        const inventoryPlan: InventoryPlan = {
            startDate: new Date(),
            endDate: new Date(),
            turnoverHour: 5,
            planType: InventoryPlanType.MANUFACTURING,
            dailyRate: -5
        };

        //  act/assert
        //  Test negative daily rate
        await expect(async () => {
            await api.execute("", `{ "itemId": "${itemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");

        //  Test dailyRate = 0 edge case
        inventoryPlan.dailyRate = 0;

        await expect(async () => {
            await api.execute("", `{ "itemId": "${itemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });
});
