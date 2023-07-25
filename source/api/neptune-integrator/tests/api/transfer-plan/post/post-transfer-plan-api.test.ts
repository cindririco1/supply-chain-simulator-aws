// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { PostTransferPlanApi } from "../../../../api/transfer-plan/post/post-transfer-plan-api";
import { TransferPlan } from "neptune/model/transfer-plan";
import { VertexLabel, EdgeLabel, TransferPlanStatus } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("postTransferPlanApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PostTransferPlanApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should call database with proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const itemId = "test_item_id";
        const transferPlanId = "test_transfer_plan_id";
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";
        const sku = "test_sku";

        const transferPlan: TransferPlan = {
            shipDate: new Date(),
            arrivalDate: new Date(),
            transferAmount: 5
        };

        const mockCreateVertex = (db.createVertex = jest.fn().mockImplementationOnce(async () => {
            return { id: transferPlanId, response: "mockVertexResponse" };
        }) as any);
        const mockCreateEdge = (db.createEdge = jest.fn().mockImplementation(async () => {
            return "mockEdgeResponse";
        }) as any);

        const mockGetAllConnected_k_hop = (db.getAllConnected_k_hop = jest.fn().mockImplementation(async () => {
            return [{ id: "test_item_id", sku: "test_sku" }];
        }) as any);

        const api = new PostTransferPlanApi(db);

        const mockValidateTransferEdgeExists = (api.validateTransferEdgeExists = jest
            .fn()
            .mockImplementation(async () => {
                return true;
            }) as any);

        // act
        const result = await api.execute(
            "",
            `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}", "sku": "${sku}", "transferPlan": ${JSON.stringify(
                transferPlan
            )} }`,
            {}
        );

        // assert
        expect(mockCreateVertex).toHaveBeenCalledTimes(1);
        expect(mockCreateVertex).toHaveBeenCalledWith(VertexLabel.TRANSFER_PLAN, {
            shipDate: transferPlan.shipDate?.toISOString(),
            fromItemId: "test_item_id",
            toItemId: "test_item_id",
            arrivalDate: transferPlan.arrivalDate?.toISOString(),
            transferAmount: transferPlan.transferAmount,
            status: TransferPlanStatus.NEW
        });

        expect(mockGetAllConnected_k_hop).toHaveBeenCalledTimes(2);
        expect(mockCreateEdge).toHaveBeenCalledTimes(2);
        expect(mockCreateEdge).toHaveBeenCalledWith(
            VertexLabel.TRANSFER_PLAN,
            transferPlanId,
            VertexLabel.ITEM,
            itemId,
            EdgeLabel.GIVES,
            {}
        );
        expect(mockCreateEdge).toHaveBeenCalledWith(
            VertexLabel.TRANSFER_PLAN,
            transferPlanId,
            VertexLabel.ITEM,
            itemId,
            EdgeLabel.TAKES,
            {}
        );
        expect(JSON.parse(result.body)).toEqual({
            transferPlan: { id: transferPlanId, response: "mockVertexResponse" },
            givesEdge: "mockEdgeResponse",
            takesEdge: "mockEdgeResponse"
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostTransferPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if transferPlan is missing arguments", async () => {
        // arrange
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";
        const sku = "test_sku";
        const db = NeptuneDB.prototype;
        const api = new PostTransferPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute(
                "",
                `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}", "sku": "${sku}", "transferPlan": {"transferAmount": 5} }`,
                {}
            );
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if a mandatory property is not present", async () => {
        // arrange
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";
        const db = NeptuneDB.prototype;
        const api = new PostTransferPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute(
                "",
                `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}", "transferPlan": {"transferAmount": 5} }`,
                {}
            );
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostTransferPlanApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });

    it("validateTransferEdgeExists | success: return true | transfer edge exists", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostTransferPlanApi(db);

        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";

        const mockGetAllEdges = (db.getAllEdges = jest.fn().mockImplementationOnce(async () => {
            return [{ id: "test_id", from: fromLocationId, to: toLocationId }];
        }) as any);

        // act
        const result = await api.validateTransferEdgeExists(fromLocationId, toLocationId);

        // assert
        expect(mockGetAllEdges).toHaveBeenCalledTimes(1);
        expect(result).toEqual(true);
    });

    it("validateTransferEdgeExists | success: return false | transfer edge does not exist", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostTransferPlanApi(db);

        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";

        const mockGetAllEdges = (db.getAllEdges = jest.fn().mockImplementationOnce(async () => {
            return [];
        }) as any);

        // act
        const result = await api.validateTransferEdgeExists(fromLocationId, toLocationId);

        // assert
        expect(mockGetAllEdges).toHaveBeenCalledTimes(1);
        expect(result).toEqual(false);
    });
});
