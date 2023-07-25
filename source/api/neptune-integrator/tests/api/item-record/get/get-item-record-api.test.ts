// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { Item } from "neptune/model/item";
import { VertexLabel } from "neptune/model/constants";
import { GetItemRecordApi } from "../../../../api/item-record/get/get-item-record-api";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getAllItemRecordApi", () => {
    it("constructor getAllItemRecordApi | success | should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetItemRecordApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("execute getAllItemRecordApi| success | should get all item records with correct itemId", async () => {
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
        const api = new GetItemRecordApi(db);

        // act
        const result = await api.execute(`GET /item/${itemId}`, "", {});

        // assert
        console.log(result.body);
        expect(mock).toHaveBeenCalledWith(VertexLabel.ITEM_RECORD, itemId);

        expect(JSON.parse(result.body)["itemRecord"]).toEqual(JSON.parse(JSON.stringify(item)));
    });

    it("execute getAllItemRecordApi | failure | should return 404 if items are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const itemId = "1234";
        const api = new GetItemRecordApi(db);

        // act
        const result = await api.execute(`GET /item/${itemId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
