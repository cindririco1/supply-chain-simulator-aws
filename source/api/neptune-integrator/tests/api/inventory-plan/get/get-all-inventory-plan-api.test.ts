// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetAllInventoryPlanApi } from "../../../../api/inventory-plan/get/get-all-inventory-plan-api";
import { InventoryPlan } from "neptune/model/inventory-plan";
import { VertexLabel, InventoryPlanType } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getAllInventoryPlanApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetAllInventoryPlanApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const inventoryPlanId = "test_inventory_plan_id";
        const inventoryPlan1: InventoryPlan = {
            id: inventoryPlanId,
            startDate: new Date(),
            endDate: new Date(),
            turnoverHour: 1,
            planType: InventoryPlanType.MANUFACTURING,
            dailyRate: 1000
        };
        const inventoryPlan2: InventoryPlan = {
            id: inventoryPlanId,
            startDate: new Date(),
            endDate: new Date(),
            turnoverHour: 2,
            planType: InventoryPlanType.SALES,
            dailyRate: 2000
        };
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return [inventoryPlan1, inventoryPlan2];
        }) as any);
        const api = new GetAllInventoryPlanApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(VertexLabel.INVENTORY_PLAN);
        expect(JSON.parse(result.body)["inventoryPlans"][0]).toEqual(JSON.parse(JSON.stringify(inventoryPlan1)));
        expect(JSON.parse(result.body)["inventoryPlans"][1]).toEqual(JSON.parse(JSON.stringify(inventoryPlan2)));
    });

    it("should return 404 if items are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetAllInventoryPlanApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
