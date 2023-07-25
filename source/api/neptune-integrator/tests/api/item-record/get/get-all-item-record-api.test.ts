// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { ItemRecord } from "../../../../../../shared/neptune/model/item-record";
import { GetAllItemRecordApi } from "../../../../api/item-record/get/get-all-item-record-api";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getAllItemRecordApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetAllItemRecordApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const itemRecordId = "test_item_id";
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
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return [itemRecord1, itemRecord2];
        }) as any);
        const api = new GetAllItemRecordApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(VertexLabel.ITEM_RECORD);
        expect(JSON.parse(result.body)["itemRecords"][0]).toEqual(JSON.parse(JSON.stringify(itemRecord1)));
        expect(JSON.parse(result.body)["itemRecords"][1]).toEqual(JSON.parse(JSON.stringify(itemRecord2)));
    });

    it("should return 404 if items are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetAllItemRecordApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
