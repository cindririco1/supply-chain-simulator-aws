// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetAllItemApi } from "../../../../api/item/get/get-all-item-api";
import { Item } from "neptune/model/item";
import { VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getAllItemApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetAllItemApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const itemId = "test_item_id";
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
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return [item1, item2];
        }) as any);
        const api = new GetAllItemApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(VertexLabel.ITEM);
        expect(JSON.parse(result.body)["items"][0]).toEqual(JSON.parse(JSON.stringify(item1)));
        expect(JSON.parse(result.body)["items"][1]).toEqual(JSON.parse(JSON.stringify(item2)));
    });

    it("should return 404 if items are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetAllItemApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
