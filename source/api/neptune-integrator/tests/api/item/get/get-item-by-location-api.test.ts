// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetItemByLocationApi } from "../../../../api/item/get/get-item-by-location-api";
import { Item } from "neptune/model/item";
import { EdgeDirection, VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getAllItemApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetItemByLocationApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const itemId = "test_item_id";
        const locationId = "test_location_id";
        const item1: Item = {
            id: itemId,
            sku: "test_sku1",
            amount: 5,
            userDefinedFields: `{"field_1": "field1_val" }`
        };
        const item2: Item = {
            id: itemId,
            sku: "test_sku2",
            amount: 10,
            userDefinedFields: `{"field_2": "field1_val" }`
        };
        const mock = (db.getAllConnected = jest.fn().mockImplementationOnce(async () => {
            return [item1, item2];
        }) as any);
        const api = new GetItemByLocationApi(db);

        // act
        const result = await api.execute(`GET /item/location/${locationId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledWith(VertexLabel.LOCATION, VertexLabel.ITEM, locationId, EdgeDirection.IN);
        expect(JSON.parse(result.body)["items"][0]).toEqual(JSON.parse(JSON.stringify(item1)));
        expect(JSON.parse(result.body)["items"][1]).toEqual(JSON.parse(JSON.stringify(item2)));
    });

    it("should return 404 if items are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationId = "1234";
        const mock = (db.getAllConnected = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetItemByLocationApi(db);

        // act
        const result = await api.execute(`GET /item/location/${locationId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
