// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeLabel, VertexLabel } from "neptune/model/constants";
import { DeleteTransferApi } from "../../../../../api/location/transfer-relationship/delete/delete-transfer-api";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("deleteTransferApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new DeleteTransferApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should execute with correct locationId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.deleteEdge = jest.fn().mockImplementationOnce(async () => {
            return "mockDeleteResponse";
        }) as any);
        const api = new DeleteTransferApi(db);
        const fromLocationId = "from_location_id";
        const toLocationId = "to_location_id";

        // act
        const result = await api.execute(
            "",
            `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}" }`,
            {}
        );

        // assert
        expect(mock).toHaveBeenCalledWith(
            VertexLabel.LOCATION,
            fromLocationId,
            VertexLabel.LOCATION,
            toLocationId,
            EdgeLabel.TRANSFERS
        );
        expect(JSON.parse(result.body)).toEqual({
            success: "mockDeleteResponse"
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteTransferApi(db);

        // act
        const response = await api.execute("", ``, {});

        // assert
        expect(response.statusCode).toBe(400);
    });

    it("should return bad request if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteTransferApi(db);

        // act
        const response = await api.execute("", null, {});

        // assert
        expect(response.statusCode).toBe(400);
    });
});
