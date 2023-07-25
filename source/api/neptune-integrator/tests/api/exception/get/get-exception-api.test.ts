// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetExceptionApi } from "../../../../api/exception/get/get-exception-api";
import { Item } from "neptune/model/item";
import { Rule } from "neptune/model/rule";
import { Edge } from "neptune/model/edge";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("GetExceptionApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetExceptionApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const item: Item = {
            id: "item_id",
            sku: "test_sku1",
            amount: 5,
            userDefinedFields: `{"field_1": "field1_val" }`
        };
        const violationEdge: Edge = {
            id: "edge_id"
        };
        const rule: Rule = {
            id: "rule_id",
            name: "some-sku-rule",
            minAllowed: 0,
            maxAllowed: 100
        };
        const results = { invalidItem: item, invalidEdge: violationEdge, rule: rule };
        const mock = (db.getInvalidItems = jest.fn().mockImplementationOnce(async () => {
            return [results];
        }) as any);
        const api = new GetExceptionApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(undefined, undefined);
        expect(JSON.parse(result.body)["results"][0]).toEqual(JSON.parse(JSON.stringify(results)));
    });

    it("should return 404 if exceptions are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getInvalidItems = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetExceptionApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
