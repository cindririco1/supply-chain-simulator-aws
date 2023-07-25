// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel, VertexLabel } from "neptune/model/constants";
import { PutTransferApi } from "../../../../../api/location/transfer-relationship/put/put-transfer-api";
import { TransferPlan } from "neptune/model/transfer-plan";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("putTransferApi", () => {
    it("constructor postTransferApi | success | object defined", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PutTransferApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("execute putTransferApi | success | transfer edge updated", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";
        const edgeId = "test_edge_id";
        const planId = "test_plan_id";
        const leadTime = 5;
        const edge = {
            id: edgeId,
            leadTime: leadTime
        };
        const transferPlan: TransferPlan = {
            id: planId,
            shipDate: new Date(),
            arrivalDate: new Date(),
            transferAmount: 5
        };

        const mockGetEdge = (db.getEdgeBetweenVertices = jest.fn().mockImplementationOnce(async () => {
            return edge;
        }) as any);
        const mockUpdateEdge = (db.updateEdge = jest.fn().mockImplementationOnce(async () => {
            return { edge: "mockUpdateEdgeResponse" };
        }) as any);
        const mockGetPlan = (db.getTransferplansBetweenTransferEdge = jest.fn().mockImplementationOnce(async () => {
            return [transferPlan];
        }) as any);
        const mockUpdateVertex = (db.updateVertex = jest.fn().mockImplementationOnce(async () => {
            return true;
        }) as any);
        const api = new PutTransferApi(db);

        // act
        const result = await api.execute(
            "",
            `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}", "leadTime": "${leadTime}" }`,
            {}
        );

        // assert
        expect(mockGetEdge).toHaveBeenCalledTimes(1);
        expect(mockGetEdge).toHaveBeenCalledWith(EdgeDirection.OUT, fromLocationId, toLocationId);
        expect(mockUpdateEdge).toHaveBeenCalledTimes(1);
        expect(mockUpdateEdge).toHaveBeenCalledWith(EdgeLabel.TRANSFERS, edge, {
            leadTime: "5"
        });
        expect(mockGetPlan).toHaveBeenCalledTimes(1);
        expect(mockGetPlan).toHaveBeenCalledWith(fromLocationId, toLocationId);
        expect(mockUpdateVertex).toHaveBeenCalledTimes(1);
        expect(mockUpdateVertex).toHaveBeenCalledWith(VertexLabel.TRANSFER_PLAN, transferPlan);
    });

    it("execute putTransferApi | should throw an error if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutTransferApi(db);

        // act
        const response = await api.execute("", `{}`, {});

        // assert
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({ message: "Transfer Properties could not be extracted from body" });
    });

    it("execute putTransferApi | failure | transfer is missing arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutTransferApi(db);
        const fromLocationId = "test_from_location_id";

        // act
        const response = await api.execute("", `{ "fromLocationId": "${fromLocationId}"}`, {});

        // assert
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({ message: "Transfer Properties could not be extracted from body" });
    });

    it("execute putTransferApi | failure | body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutTransferApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("Cannot read properties of null (reading 'fromLocationId')");
    });
});
