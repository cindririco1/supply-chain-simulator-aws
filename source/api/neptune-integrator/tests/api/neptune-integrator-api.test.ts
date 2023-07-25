// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { NeptuneIntegratorApi } from "../../api/neptune-integrator-api";
import { VertexLabel } from "neptune/model/constants";
import { Item } from "neptune/model/item";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("NeptuneIntegratorApi", () => {
    it("constructor | success | creates object", async () => {
        // act
        const api = new NeptuneIntegratorApi();

        // assert
        expect(api).toBeDefined();
    });

    it("execute neptuneIntegratorApi | success | Sets up Api", async () => {
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
        const dbCloseMock = (db.close = jest.fn() as any);
        const api = new NeptuneIntegratorApi();

        // act
        const result = await api.execute("GET", "/item", "", null, {}, null);

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(dbCloseMock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(VertexLabel.ITEM);
        expect(JSON.parse(result.body)["items"][0]).toEqual(JSON.parse(JSON.stringify(item1)));
        expect(JSON.parse(result.body)["items"][1]).toEqual(JSON.parse(JSON.stringify(item2)));
    });

    it("execute neptuneIntegratorApi | failure | closes the database", async () => {
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
            throw new Error("mock error");
        }) as any);
        const dbCloseMock = (db.close = jest.fn() as any);
        const api = new NeptuneIntegratorApi();

        // act
        const result = await api.execute("GET", "/item", "", null, {}, null);

        // assert
        expect(dbCloseMock).toHaveBeenCalledTimes(1);
    });
});
