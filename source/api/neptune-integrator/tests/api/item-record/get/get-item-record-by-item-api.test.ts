// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel } from "neptune/model/constants";
import { ItemRecord } from "neptune/model/item-record";
import { GetItemRecordByItemApi } from "../../../../api/item-record/get/get-item-record-by-item-api";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getItemRecordByItemApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetItemRecordByItemApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const itemId = "test_item_id";
        const itemRecordId = "test_item_record_id";
        const itemRecord1: ItemRecord = {
            id: itemRecordId,
            dateFrom: new Date(),
            dateTo: new Date(),
            fromAmount: 5,
            toAmount: 10,
            planId: "1234"
        };
        const itemRecord2: ItemRecord = {
            id: itemRecordId,
            dateFrom: new Date(),
            dateTo: new Date(),
            fromAmount: 10,
            toAmount: 15,
            planId: "1234"
        };
        const mock = (db.getEdgeVertex = jest.fn().mockImplementationOnce(async () => {
            return [itemRecord1, itemRecord2];
        }) as any);
        const api = new GetItemRecordByItemApi(db);

        // act
        const result = await api.execute(`GET /item-record/item/${itemId}`);

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(itemId, EdgeLabel.RECORDED, EdgeDirection.OUT);
        expect(JSON.parse(result.body)["itemRecords"][0]).toEqual(JSON.parse(JSON.stringify(itemRecord1)));
        expect(JSON.parse(result.body)["itemRecords"][1]).toEqual(JSON.parse(JSON.stringify(itemRecord2)));
    });

    it("should return 404 if items are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const itemId = "test_item_id";
        const mock = (db.getEdgeVertex = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetItemRecordByItemApi(db);

        // act
        const result = await api.execute(`GET /item-record/item/${itemId}`);

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
