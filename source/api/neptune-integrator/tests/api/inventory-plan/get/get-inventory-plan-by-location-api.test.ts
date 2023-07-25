// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetInventoryPlanByLocationApi } from "../../../../api/inventory-plan/get/get-inventory-plan-by-location-api";
import { InventoryPlan } from "neptune/model/inventory-plan";
import { InventoryPlanType } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("GetInventoryPlanByLocationApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetInventoryPlanByLocationApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const inventoryPlanId = "test_inventory_plan_id";
        const locationId = "test_location_id";
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
        const mock = (db.getInventoryPlans = jest.fn().mockImplementationOnce(async () => {
            return [inventoryPlan1, inventoryPlan2];
        }) as any);

        const api = new GetInventoryPlanByLocationApi(db);

        // act
        const result = await api.execute(`GET /inventory-plan/location/${locationId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledWith(locationId);
        expect(JSON.parse(result.body)["inventoryPlans"][0]).toEqual(JSON.parse(JSON.stringify(inventoryPlan1)));
        expect(JSON.parse(result.body)["inventoryPlans"][1]).toEqual(JSON.parse(JSON.stringify(inventoryPlan2)));
    });

    it("should return empty result if inventoryPlans are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationId = "1234";
        const mock = (db.getInventoryPlans = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetInventoryPlanByLocationApi(db);

        // act
        const result = await api.execute(`GET /inventory-plan/location/${locationId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(JSON.parse(result.body)["inventoryPlans"]).toEqual([]);
    });
});
