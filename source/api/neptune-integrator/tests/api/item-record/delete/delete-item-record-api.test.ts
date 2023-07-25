// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { DeleteItemRecordApi } from "../../../../api/item-record/delete/delete-item-record-api";
import { ItemRecord } from "neptune/model/item-record";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("deleteItemRecordApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new DeleteItemRecordApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should execute with correct itemRecordId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.deleteById = jest.fn().mockImplementationOnce(async () => {
            return "mockDeleteResponse";
        }) as any);
        const api = new DeleteItemRecordApi(db);
        const itemRecordId = "1234";
        const itemRecord: ItemRecord = {
            id: itemRecordId,
            dateFrom: new Date(),
            dateTo: new Date(),
            fromAmount: 5,
            toAmount: 10,
            planId: "1234"
        };

        // act
        const result = await api.execute("", JSON.stringify(itemRecord), {});

        // assert
        expect(mock).toHaveBeenCalledWith(VertexLabel.ITEM_RECORD, JSON.parse(JSON.stringify(itemRecord)));
        expect(JSON.parse(result.body)).toEqual({
            success: "mockDeleteResponse"
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteItemRecordApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteItemRecordApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });
});
