// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetAllTransferPlanApi } from "../../../../api/transfer-plan/get/get-all-transfer-plan-api";
import { TransferPlan } from "neptune/model/transfer-plan";
import { VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getAllTransferPlanApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetAllTransferPlanApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const transferPlanId = "test_transfer_plan_id";
        const transferPlan1: TransferPlan = {
            id: transferPlanId,
            shipDate: new Date(),
            arrivalDate: new Date(),
            transferAmount: 5
        };
        const transferPlan2: TransferPlan = {
            id: transferPlanId,
            shipDate: new Date(),
            arrivalDate: new Date(),
            transferAmount: 10
        };
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return [transferPlan1, transferPlan2];
        }) as any);
        const api = new GetAllTransferPlanApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(VertexLabel.TRANSFER_PLAN);
        expect(JSON.parse(result.body)["transferPlans"][0]).toEqual(JSON.parse(JSON.stringify(transferPlan1)));
        expect(JSON.parse(result.body)["transferPlans"][1]).toEqual(JSON.parse(JSON.stringify(transferPlan2)));
    });

    it("should return 404 if items are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetAllTransferPlanApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
