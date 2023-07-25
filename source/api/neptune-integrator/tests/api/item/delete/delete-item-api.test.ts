// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { DeleteItemApi } from "../../../../api/item/delete/delete-item-api";
import { Item } from "neptune/model/item";
import { VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("deleteItemApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new DeleteItemApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should execute with correct itemId", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.deleteById = jest.fn().mockImplementationOnce(async () => {
            return "mockDeleteResponse";
        }) as any);
        const api = new DeleteItemApi(db);
        const itemId = "1234";
        const item: Item = {
            id: itemId
        };

        // act
        const result = await api.execute("", JSON.stringify(item), {});

        // assert
        expect(mock).toHaveBeenCalledWith(VertexLabel.ITEM, item);
        expect(JSON.parse(result.body)).toEqual({
            success: "mockDeleteResponse"
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteItemApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new DeleteItemApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });
});
