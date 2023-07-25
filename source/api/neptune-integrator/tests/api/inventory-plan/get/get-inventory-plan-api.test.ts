// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetInventoryPlanApi } from "../../../../api/inventory-plan/get/get-inventory-plan-api";
import { InventoryPlan } from "neptune/model/inventory-plan";
import { VertexLabel, InventoryPlanType } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getInventoryPlanApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetInventoryPlanApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should execute with correct inventoryPlanId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const inventoryPlanId = "test_inventory_plan_id";
        const inventoryPlan: InventoryPlan = {
            id: inventoryPlanId,
            startDate: new Date(),
            endDate: new Date(),
            turnoverHour: 1,
            planType: InventoryPlanType.MANUFACTURING,
            dailyRate: 1000
        };
        const mock = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return inventoryPlan;
        }) as any);
        const api = new GetInventoryPlanApi(db);

        // act
        const result = await api.execute(`GET /inventory-plan/${inventoryPlanId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledWith(VertexLabel.INVENTORY_PLAN, inventoryPlanId);

        expect(JSON.parse(result.body)["inventoryPlan"]).toEqual(JSON.parse(JSON.stringify(inventoryPlan)));
    });

    it("should return 404 if inventoryPlans are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const inventoryPlanId = "1234";
        const api = new GetInventoryPlanApi(db);

        // act
        const result = await api.execute(`GET /inventory-plan/${inventoryPlanId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
