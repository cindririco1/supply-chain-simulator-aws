// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetAllUpstreamTransferApi } from "../../../../../api/location/transfer-relationship/get/get-upstream-transfer-api";
import { Location } from "neptune/model/location";
import { VertexLabel, LocationType, EdgeDirection } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getAllUpstreamTransferApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetAllUpstreamTransferApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("execute GetAllUpstreamTransferApi | success | return proper upstream transfers", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const sourceLocationId = "test_source_location_id";
        const locationId1 = "test_location_id1";
        const locationName1 = "test_location_name1";
        const userDefinedFields1 = `{"field_1": "field1_val" }`;
        const location1: Location = {
            id: locationId1,
            description: locationName1,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields1
        };
        const locationId2 = "test_location_id2";
        const locationName2 = "test_location_name2";
        const userDefinedFields2 = `{"field_1": "field1_val" }`;
        const location2: Location = {
            id: locationId2,
            description: locationName2,
            type: LocationType.MANUFACTURER,
            userDefinedFields: userDefinedFields2
        };
        const edgeId = "test_edge_id";
        const leadTime = 5;
        const edge = {
            id: edgeId,
            leadTime: leadTime
        };
        const updatedLocation1 = location1 as any;
        updatedLocation1["leadTime"] = leadTime;
        const updatedLocation2 = location2 as any;
        updatedLocation2["leadTime"] = leadTime;

        const mockGetAll = (db.getAllConnected = jest.fn().mockImplementationOnce(async () => {
            return [location1, location2];
        }) as any);
        const mockGetEdge = (db.getEdgeBetweenVertices = jest
            .fn()
            .mockImplementationOnce(async () => {
                return edge;
            })
            .mockImplementationOnce(async () => {
                return edge;
            }) as any);
        const api = new GetAllUpstreamTransferApi(db);

        // act
        const result = await api.execute(`GET /location/transfer/upstream/${sourceLocationId}`, null, {});

        // assert
        expect(mockGetAll).toHaveBeenCalledTimes(1);
        expect(mockGetAll).toHaveBeenCalledWith(
            VertexLabel.LOCATION,
            VertexLabel.LOCATION,
            sourceLocationId,
            EdgeDirection.IN
        );
        expect(JSON.parse(result.body)["locations"][0]).toEqual(JSON.parse(JSON.stringify(location1)));
        expect(JSON.parse(result.body)["locations"][1]).toEqual(JSON.parse(JSON.stringify(location2)));
        expect(mockGetEdge).toHaveBeenCalledTimes(2);
        expect(mockGetEdge.mock.calls).toEqual([
            [EdgeDirection.OUT, location1.id, sourceLocationId], // First call
            [EdgeDirection.OUT, location2.id, sourceLocationId] // Second call
        ]);
        expect(JSON.parse(result.body)["locations"][0]).toEqual(JSON.parse(JSON.stringify(updatedLocation1)));
        expect(JSON.parse(result.body)["locations"][1]).toEqual(JSON.parse(JSON.stringify(updatedLocation2)));
    });

    it("execute GetAllUpstreamTransferApi | failure | locations are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getAllConnected = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetAllUpstreamTransferApi(db);

        // act
        const result = await api.execute(`GET /location/transfer/upstream/testId`, null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
