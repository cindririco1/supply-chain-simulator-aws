// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { DeleteLocationApi } from "../../../../api/location/delete/delete-location-api";
import { Location } from "neptune/model/location";
import { VertexLabel, LocationType } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("deleteLocationApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new DeleteLocationApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should execute with correct locationId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.deleteById = jest.fn().mockImplementationOnce(async () => {
            return "mockDeleteResponse";
        }) as any);
        const api = new DeleteLocationApi(db);
        const locationId = "test_location_id";
        const locationName = "test_location_name";
        const userDefinedFields = `{"field_1": "field1_val" }`;
        const location: Location = {
            id: locationId,
            description: locationName,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields
        };

        // act
        const result = await api.execute("", JSON.stringify(location), {});

        // assert
        expect(mock).toHaveBeenCalledWith(VertexLabel.LOCATION, location);
        expect(JSON.parse(result.body)).toEqual({
            success: "mockDeleteResponse"
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteLocationApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteLocationApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });
});
