// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { PostLocationApi } from "../../../../api/location/post/post-location-api";
import { Location } from "neptune/model/location";
import { VertexLabel, EdgeLabel, LocationType } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("postLocationApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PostLocationApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should call database with proper values", async () => {
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

        const mockCreateVertex = (db.createVertex = jest.fn().mockImplementationOnce(async () => {
            return { id: locationId, response: "mockVertexResponse" };
        }) as any);
        const api = new PostLocationApi(db);

        // act
        const result = await api.execute("", `${JSON.stringify(location)}`, {});

        // assert
        expect(mockCreateVertex).toHaveBeenCalledTimes(1);
        expect(mockCreateVertex).toHaveBeenCalledWith(
            VertexLabel.LOCATION,
            expect.objectContaining({
                description: location.description,
                type: location.type,
                userDefinedFields: location.userDefinedFields
            })
        );
    });

    it("should throw an error if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostLocationApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if location is missing arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostLocationApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", `{ "location": {"description": ""}}`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if location has invalid type", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostLocationApi(db);
        const location: Location = {
            description: "someName",
            type: "not_a_real_type" as LocationType,
            userDefinedFields: ""
        };

        // act/assert
        await expect(async () => {
            await api.execute("", JSON.stringify(location), {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostLocationApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });
});
