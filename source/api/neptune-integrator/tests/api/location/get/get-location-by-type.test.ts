// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetLocationByTypeApi } from "../../../../api/location/get/get-location-by-type-api";
import { Location } from "neptune/model/location";
import { LocationType, VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getLocationByTypeApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetLocationByTypeApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationId1 = "test_location_id1";
        const locationName1 = "test_location_name1";
        const userDefinedFields1 = `{"field_1": "field1_val" }`;
        const location1: Location = {
            id: locationId1,
            description: locationName1,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields1
        };
        const locationId2 = "test_location_id1";
        const locationName2 = "test_location_name1";
        const userDefinedFields2 = `{"field_1": "field1_val" }`;
        const location2: Location = {
            id: locationId2,
            description: locationName2,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields2
        };

        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return [location1, location2];
        }) as any);
        const api = new GetLocationByTypeApi(db);

        // act
        const result = await api.execute(`GET /location/type/${LocationType.MANUFACTURER}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledWith(VertexLabel.LOCATION, { type: LocationType.MANUFACTURER });
        expect(JSON.parse(result.body)["locations"][0]).toEqual(JSON.parse(JSON.stringify(location1)));
        expect(JSON.parse(result.body)["locations"][1]).toEqual(JSON.parse(JSON.stringify(location2)));
    });

    it("should return 404 if locations are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationType = "zzz";
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetLocationByTypeApi(db);

        // act
        const result = await api.execute(`GET /location/type/${locationType}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
