// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { PostItemApi } from "../../../../api/item/post/post-item-api";
import { Item } from "neptune/model/item";
import { EdgeLabel, VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("postItemApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PostItemApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should call database with proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const itemId = "test_item_id";
        const locationId = "test_location_id";
        //We use the id property here to pass the location the edge should be built off of.
        const item: Item = {
            sku: "test_sku1",
            amount: 5,
            userDefinedFields: `{"field_1": "field1_val" }`
        };

        const mockCreateVertex = (db.createVertex = jest.fn().mockImplementationOnce(async () => {
            return { id: itemId, response: "mockVertexResponse" };
        }) as any);
        const mockCreateEdge = (db.createEdge = jest.fn().mockImplementationOnce(async () => {
            return "mockEdgeResponse";
        }) as any);
        const api = new PostItemApi(db);

        // act
        const result = await api.execute("", `{ "locationId": "${locationId}", "item": ${JSON.stringify(item)} }`, {});

        // assert
        expect(mockCreateVertex).toHaveBeenCalledTimes(1);
        //Get around the fact that the dateEntered property is added to the item in the api and the id is removed.
        expect(mockCreateVertex).toHaveBeenCalledWith(
            VertexLabel.ITEM,
            expect.objectContaining({
                sku: item.sku,
                amount: item.amount,
                userDefinedFields: item.userDefinedFields
            })
        );

        expect(mockCreateEdge).toHaveBeenCalledTimes(1);
        expect(mockCreateEdge).toHaveBeenCalledWith(
            VertexLabel.ITEM,
            itemId,
            VertexLabel.LOCATION,
            locationId,
            EdgeLabel.RESIDES,
            {}
        );
        expect(JSON.parse(result.body)).toEqual({
            item: { id: itemId, response: "mockVertexResponse" },
            edge: "mockEdgeResponse"
        });
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostItemApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if item is missing arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostItemApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", `{ "locationId":"testId", "item": {"sku":"test_sku"}}`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if locationId is not present", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostItemApi(db);
        const item: Item = {
            sku: "test_sku1",
            amount: 5,
            userDefinedFields: `{"field_1": "field1_val" }`
        };
        // act/assert
        await expect(async () => {
            await api.execute("", `{"item": ${JSON.stringify(item)}}`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostItemApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });
});
