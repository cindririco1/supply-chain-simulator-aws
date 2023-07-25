// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetLocationApi } from "../../../../api/location/get/get-location-api";
import { Location } from "neptune/model/location";
import { VertexLabel, LocationType } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getLocationApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetLocationApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should execute with correct locationId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationId = "test_location_id";
        const locationName = "test_location_name";
        const userDefinedFields = `{"field_1": "field1_val" }`;
        const location: Location = {
            description: locationName,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields
        };
        const mock = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return location;
        }) as any);
        const api = new GetLocationApi(db);

        // act
        const result = await api.execute(`GET /location/${locationId}`, "", {});

        // assert
        console.log(result.body);
        expect(mock).toHaveBeenCalledWith(VertexLabel.LOCATION, locationId);

        expect(JSON.parse(result.body)["location"]).toEqual(JSON.parse(JSON.stringify(location)));
    });

    it("should return 404 if locations are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const locationId = "1234";
        const api = new GetLocationApi(db);

        // act
        const result = await api.execute(`GET /location/${locationId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
