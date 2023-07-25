// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetTransferPlanByLocationApi } from "../../../../api/transfer-plan/get/get-transfer-plan-by-location-api";
import { TransferPlan } from "neptune/model/transfer-plan";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getTransferPlanByLocationApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetTransferPlanByLocationApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should execute with correct transferPlanId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationId = "test_location_id";
        const transferPlan1: TransferPlan = {
            id: "test_transfer_plan_id_1",
            shipDate: new Date(),
            arrivalDate: new Date(),
            transferAmount: 5
        };
        const transferPlan2: TransferPlan = {
            id: "test_transfer_plan_id_2",
            shipDate: new Date(),
            arrivalDate: new Date(),
            transferAmount: 5
        };
        const mockGetTransferPlans = (db.getTransferPlans = jest.fn().mockImplementation(async () => {
            return [transferPlan1, transferPlan2];
        }) as any);

        const api = new GetTransferPlanByLocationApi(db);

        // act
        const result = await api.execute(`GET /transfer-plan/${locationId}`, "", {});

        // assert
        expect(mockGetTransferPlans).toHaveBeenCalledTimes(2);
        expect(JSON.parse(result.body)["transferPlans"][0]).toEqual(JSON.parse(JSON.stringify(transferPlan1)));
        expect(JSON.parse(result.body)["transferPlans"][1]).toEqual(JSON.parse(JSON.stringify(transferPlan2)));
    });

    it("should return empty result if transferPlans are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mockGetTransferPlans = (db.getTransferPlans = jest.fn().mockImplementation(async () => {
            return undefined;
        }) as any);
        const locationId = "1234";
        const api = new GetTransferPlanByLocationApi(db);

        // act
        const result = await api.execute(`GET /transfer-plan/${locationId}`, "", {});

        // assert
        expect(mockGetTransferPlans).toHaveBeenCalledTimes(2);
        expect(JSON.parse(result.body)["transferPlans"]).toEqual([]);
    });
});
