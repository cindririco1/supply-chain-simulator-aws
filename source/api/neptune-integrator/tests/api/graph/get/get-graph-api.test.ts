// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetGraphApi } from "../../../../api/graph/get/get-graph-api";
import { Location } from "neptune/model/location";
import { Edge } from "neptune/model/edge";
import { EdgeDirection, EdgeLabel, LocationType, VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getGraphApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetGraphApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        const location1: Location = {
            id: "test_id",
            description: "test_description_1",
            type: LocationType.MANUFACTURER,
            userDefinedFields: `{"field_1": "field1_val" }`
        };
        const location2: Location = {
            id: "test_id2",
            description: "test_description_2",
            type: LocationType.DISTRIBUTOR,
            userDefinedFields: `{"field_2": "field2_val" }`
        };
        const mock1 = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return [location1, location2];
        }) as any);
        const edge: Edge = {
            id: "test_edge_id",
            from: "test_id",
            to: "test_id2"
        };
        const mock2 = (db.getAllLabelConnectedEdges_k_hop = jest.fn().mockImplementationOnce(async () => {
            return [edge];
        }) as any);

        const api = new GetGraphApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock1).toHaveBeenCalledTimes(1);
        expect(mock1).toHaveBeenCalledWith(VertexLabel.LOCATION);
        expect(JSON.parse(result.body)["locations"][0]).toEqual(JSON.parse(JSON.stringify(location1)));
        expect(JSON.parse(result.body)["locations"][1]).toEqual(JSON.parse(JSON.stringify(location2)));
        expect(mock2).toHaveBeenCalledTimes(1);
        expect(mock2).toHaveBeenCalledWith(VertexLabel.LOCATION, EdgeLabel.TRANSFERS, EdgeDirection.OUT, []);
        expect(JSON.parse(result.body)["transfers"][0]).toEqual(JSON.parse(JSON.stringify(edge)));
    });

    it("should return 404 if locations are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const mock2 = (db.getAllLabelConnectedEdges_k_hop = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);

        const api = new GetGraphApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
