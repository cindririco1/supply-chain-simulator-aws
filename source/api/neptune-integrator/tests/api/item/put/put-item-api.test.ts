// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeLabel, VertexLabel } from "neptune/model/constants";
import { Item } from "neptune/model/item";
import { ItemRecord } from "neptune/model/item-record";
import { PutItemApi } from "../../../../api/item/put/put-item-api";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("putItemApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PutItemApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutItemApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if body is missing arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutItemApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", `{}`, {});
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PutItemApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("body is null");
    });

    describe("putItemApi successfully updates item", () => {
        let getVertexMock = jest.fn();
        let updateVertexMock = jest.fn();
        let createVertexMock = jest.fn();
        let createEdgeMock = jest.fn();
        const db = NeptuneDB.prototype;
        const itemId = "test_item_id";
        const itemDateEntered = new Date("01/05/2022");
        //We use the id property here to pass the location the edge should be built off of.
        const item: Item = {
            id: itemId,
            sku: "test_sku1",
            amount: 5,
            userDefinedFields: `{"field_1": "field1_val" }`
        };

        const mockDBFunctions = () => {
            updateVertexMock = db.updateVertex = jest.fn().mockImplementationOnce(async () => {
                return "mockUpdateResponse";
            }) as any;

            createVertexMock = db.createVertex = jest.fn().mockImplementationOnce(async () => {
                return "mockUpdateResponse";
            }) as any;

            createEdgeMock = db.createEdge = jest.fn().mockImplementationOnce(async () => {
                return "mockCreateEdgeResponse";
            }) as any;
        };

        const runCommonAssertions = (item: Item, result: ApiResponse, itemRecord?: ItemRecord) => {
            expect(updateVertexMock).toHaveBeenCalledTimes(1);
            expect(updateVertexMock).toHaveBeenCalledWith(VertexLabel.ITEM, item);
            expect(getVertexMock).toHaveBeenCalledTimes(1);
            expect(getVertexMock).toHaveBeenCalledWith(VertexLabel.ITEM, itemId);
            expect(JSON.parse(result.body)).toEqual({
                success: "mockUpdateResponse"
            });
            expect(createVertexMock).toHaveBeenCalledTimes(itemRecord ? 1 : 0);
            if (itemRecord) {
                expect(createVertexMock).toHaveBeenCalledWith(VertexLabel.ITEM_RECORD, itemRecord);
                expect(createEdgeMock).toHaveBeenCalledTimes(1);
                expect(createEdgeMock).toHaveBeenCalledWith(
                    VertexLabel.ITEM,
                    itemId,
                    VertexLabel.ITEM_RECORD,
                    undefined,
                    EdgeLabel.RECORDED,
                    {},
                    true
                );
            }
        };

        it("should call database with proper values", async () => {
            // arrange
            const mockDate = new Date("2023-02-12T00:00:00.000Z");
            jest.spyOn(global, "Date").mockReturnValue(mockDate);
            getVertexMock = db.getById = jest.fn().mockImplementationOnce(async () => {
                return {
                    id: itemId,
                    sku: "test_sku1",
                    amount: 2,
                    userDefinedFields: `{"field_1": "field1_val" }`,
                    dateEntered: itemDateEntered
                };
            }) as any;
            const itemRecord: ItemRecord = {
                dateTo: mockDate,
                fromAmount: 2,
                planId: "manual",
                toAmount: 5,
                dateFrom: itemDateEntered
            };
            mockDBFunctions();

            const api = new PutItemApi(db);

            // act
            const result = await api.execute("", JSON.stringify(item), {});

            // assert
            runCommonAssertions(item, result, itemRecord);
        });

        it("should not create item-record when item amount unchanged", async () => {
            getVertexMock = db.getById = jest.fn().mockImplementationOnce(async () => {
                return {
                    id: itemId,
                    sku: "test_sku1",
                    amount: 5,
                    userDefinedFields: `{"field_1": "some_field_val" }`,
                    dateEntered: itemDateEntered
                };
            }) as any;
            mockDBFunctions();
            const api = new PutItemApi(db);
            // act
            const result = await api.execute("", JSON.stringify(item), {});

            // assert
            runCommonAssertions(item, result);
        });
    });
});
