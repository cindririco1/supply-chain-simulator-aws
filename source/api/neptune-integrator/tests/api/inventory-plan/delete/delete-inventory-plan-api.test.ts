// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { DeleteInventoryPlanApi } from "../../../../api/inventory-plan/delete/delete-inventory-plan-api";
import { InventoryPlan } from "neptune/model/inventory-plan";
import { VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("deleteInventoryPlanApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new DeleteInventoryPlanApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should execute with correct inventoryPlanId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.deleteById = jest.fn().mockImplementationOnce(async () => {
            return "mockDeleteResponse";
        }) as any);
        const api = new DeleteInventoryPlanApi(db);
        const inventoryPlanId = "1234";
        const inventoryPlan: InventoryPlan = {
            id: inventoryPlanId
        };

        // act
        const result = await api.execute("", JSON.stringify(inventoryPlan), {});

        // assert
        expect(mock).toHaveBeenCalledWith(VertexLabel.INVENTORY_PLAN, inventoryPlan);
        expect(JSON.parse(result.body)).toEqual({
            success: "mockDeleteResponse"
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteInventoryPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteInventoryPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });
});
