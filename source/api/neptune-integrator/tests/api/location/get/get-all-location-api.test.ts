// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetAllLocationsApi } from "../../../../api/location/get/get-all-location-api";
import { Location } from "neptune/model/location";
import { VertexLabel, LocationType } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getAllLocationApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetAllLocationsApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationId1 = "test_location_id1";
        const locationName1 = "test_location_name1";
        const userDefinedFields = `{"field_1": "field1_val" }`;
        const location1: Location = {
            id: locationId1,
            description: locationName1,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields
        };
        const locationId2 = "test_location_id1";
        const locationName2 = "test_location_name1";
        const userDefinedFields2 = ["field_1", "field1_val"];
        const location2: Location = {
            id: locationId2,
            description: locationName2,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields
        };

        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return [location1, location2];
        }) as any);
        const api = new GetAllLocationsApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(VertexLabel.LOCATION);
        expect(JSON.parse(result.body)["locations"][0]).toEqual(JSON.parse(JSON.stringify(location1)));
        expect(JSON.parse(result.body)["locations"][1]).toEqual(JSON.parse(JSON.stringify(location2)));
    });

    it("should return 404 if locations are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetAllLocationsApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
