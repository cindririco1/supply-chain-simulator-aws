// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { PutTransferPlanApi } from "../../../../api/transfer-plan/put/put-transfer-plan-api";
import { TransferPlan } from "neptune/model/transfer-plan";
import { VertexLabel, EdgeLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("putTransferPlanApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PutTransferPlanApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should call database with proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const transferPlanId = "test_transfer_plan_id";
        const transferPlan: TransferPlan = {
            id: transferPlanId,
            transferAmount: 5
        };

        const api = new PutTransferPlanApi(db);

        const mockUpdateVertex = (db.updateVertex = jest.fn().mockImplementationOnce(async () => {
            return { id: transferPlanId, response: "mockVertexResponse" };
        }) as any);

        // act
        const result = await api.execute("", `{ "transferPlan": ${JSON.stringify(transferPlan)} }`, {});

        // assert
        expect(mockUpdateVertex).toHaveBeenCalledTimes(1);
        expect(mockUpdateVertex).toHaveBeenCalledWith(VertexLabel.TRANSFER_PLAN, transferPlan);

        expect(JSON.parse(result.body)).toEqual({
            transferPlan: { id: transferPlanId, response: "mockVertexResponse" }
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutTransferPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if body is missing arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutTransferPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", `{"transferPlan":{}}`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutTransferPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });
});
