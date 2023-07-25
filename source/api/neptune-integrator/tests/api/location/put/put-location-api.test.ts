// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { PutLocationApi } from "../../../../api/location/put/put-location-api";
import { Location } from "neptune/model/location";
import { VertexLabel, LocationType } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("putLocationApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PutLocationApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("execute putLocationApi | success | location vertex updated", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationId = "test_location_id";
        const locationName = "test_location_name";
        const userDefinedFields = `{"field_1": "field1_val" }`;
        const location: Location = {
            id: locationId,
            description: locationName,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields
        };
        const mockUpdate = (db.updateVertex = jest.fn().mockImplementationOnce(async () => {
            return "mockUpdateResponse";
        }) as any);
        const mockGet = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return { id: locationId, type: LocationType.MANUFACTURER };
        }) as any);
        const api = new PutLocationApi(db);

        // act
        const result = await api.execute("", JSON.stringify(location), {});

        // assert
        expect(mockUpdate).toHaveBeenCalledTimes(1);

        expect(mockGet).toHaveBeenCalledTimes(1);
        expect(mockGet).toHaveBeenCalledWith(VertexLabel.LOCATION, locationId);

        expect(mockUpdate).toHaveBeenCalledWith(VertexLabel.LOCATION, location);
        expect(JSON.parse(result.body)).toEqual({
            location: "mockUpdateResponse"
        });
    });

    it("execute putLocationApi | failure | prohibit update location type", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationId = "test_location_id";
        const locationName = "test_location_name";
        const userDefinedFields = `{"field_1": "field1_val" }`;
        const location: Location = {
            id: locationId,
            description: locationName,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields
        };
        const mockUpdate = (db.updateVertex = jest.fn().mockImplementationOnce(async () => {
            return "mockUpdateResponse";
        }) as any);
        const mockGet = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return { id: locationId, type: LocationType.DISTRIBUTOR };
        }) as any);
        const api = new PutLocationApi(db);

        // act
        const response = await api.execute("", JSON.stringify(location), {});

        // assert
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({ message: "Modifying location type is not allowed" });
    });

    it("execute putLocationApi | failure | incorrect request body", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutLocationApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("execute putLocationApi | failure | incorrect location type", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutLocationApi(db);
        const location: Location = {
            id: "someId",
            description: "someName",
            type: "not_a_real_type" as LocationType,
            userDefinedFields: ""
        };

        // act/assert
        await expect(async () => {
            await api.execute("", JSON.stringify(location), {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("execute putLocationApi | failure | miss body arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutLocationApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", `{}`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("execute putLocationApi | failure | body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutLocationApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });
});
