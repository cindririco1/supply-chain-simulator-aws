// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { DeleteTransferPlanApi } from "../../../../api/transfer-plan/delete/delete-transfer-plan-api";
import { TransferPlan } from "neptune/model/transfer-plan";
import { TransferPlanStatus, VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("deleteTransferPlanApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new DeleteTransferPlanApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("execute DeleteTransferPlanApi | success | transfer plan vertex deleted", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const transferPlanId = "test_transfer_plan_id";

        const transferPlan: TransferPlan = {
            id: transferPlanId,
            status: TransferPlanStatus.NEW,
            shipDate: new Date(),
            arrivalDate: new Date(),
            transferAmount: 5
        };

        const mockDelete = (db.deleteById = jest.fn().mockImplementationOnce(async () => {
            return "mockDeleteResponse";
        }) as any);
        const mockGet = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return transferPlan;
        }) as any);
        const api = new DeleteTransferPlanApi(db);

        // act
        const result = await api.execute("", JSON.stringify({ id: transferPlanId }), {});

        // assert
        expect(mockDelete).toHaveBeenCalledWith(VertexLabel.TRANSFER_PLAN, { id: transferPlanId });
        expect(JSON.parse(result.body)).toEqual({
            success: "mockDeleteResponse"
        });
        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledWith(VertexLabel.TRANSFER_PLAN, transferPlanId);
    });

    it("execute DeleteTransferPlanApi | failure | prohibit delete on in-transit transfer plan", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const transferPlanId = "test_transfer_plan_id";

        const transferPlan: TransferPlan = {
            id: transferPlanId,
            status: TransferPlanStatus.IN_TRANSIT,
            shipDate: new Date(),
            arrivalDate: new Date(),
            transferAmount: 5
        };

        const mockDelete = (db.deleteById = jest.fn().mockImplementationOnce(async () => {
            return "mockDeleteResponse";
        }) as any);
        const mockGet = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return transferPlan;
        }) as any);
        const api = new DeleteTransferPlanApi(db);

        // act/assert
        const response = await api.execute("", JSON.stringify({ id: transferPlanId }), {});

        // assert
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({
            message: "Editing an in-transit transfer plan is not allowed"
        });
    });

    it("execute DeleteTransferPlanApi | failure | body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteTransferPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("execute DeleteTransferPlanApi | failure | body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteTransferPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });
});
