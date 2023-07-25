// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetItemApi } from "../../../../api/item/get/get-item-api";
import { Item } from "neptune/model/item";
import { VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getAllItemApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetItemApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should execute with correct itemId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const itemId = "test_item_id";
        const item: Item = {
            id: itemId,
            sku: "test_sku1",
            amount: 5,
            userDefinedFields: `{"field_1": "field1_val" }`
        };
        const mock = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return item;
        }) as any);
        const api = new GetItemApi(db);

        // act
        const result = await api.execute(`GET /item/${itemId}`, "", {});

        // assert
        console.log(result.body);
        expect(mock).toHaveBeenCalledWith(VertexLabel.ITEM, itemId);

        expect(JSON.parse(result.body)["item"]).toEqual(JSON.parse(JSON.stringify(item)));
    });

    it("should return 404 if items are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const itemId = "1234";
        const api = new GetItemApi(db);

        // act
        const result = await api.execute(`GET /item/${itemId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
