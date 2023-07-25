// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetProjectionApi } from "../../../../api/projection/get/get-projection-api";
import { Item } from "neptune/model/item";
import { expect, describe, beforeEach, afterAll, jest, it } from "@jest/globals";
import { RawProjection } from "neptune/model/projection";
import { Projection } from "neptune/model/projection";

jest.mock("neptune/db/neptune-db");

describe("GetProjectionsApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetProjectionApi(db);

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
        const dateGenerated = new Date();
        const result1: RawProjection = {
            futureDate: {
                id: "future-date-id",
                date: new Date("2020-01-01"),
                daysOut: 1
            },
            projection: {
                id: "projection-id",
                inventoryEndingOnHand: 1,
                supplyInTransit: 2,
                supplyPlanned: 3,
                inventoryBeginningOnHand: 4,
                demandPlanned: 5,
                dateGenerated: dateGenerated
            }
        };
        const result2: RawProjection = {
            futureDate: {
                id: "future-date-id",
                date: new Date("2020-01-01"),
                daysOut: 2
            },
            projection: {
                id: "projection-id",
                inventoryEndingOnHand: 1,
                supplyInTransit: 2,
                supplyPlanned: 3,
                inventoryBeginningOnHand: 4,
                demandPlanned: 5,
                dateGenerated: dateGenerated
            }
        };
        const expectedResponse: Projection[] = [
            {
                date: new Date("2020-01-01"),
                daysOut: 1,
                futureDateId: "future-date-id",
                inventoryEndingOnHand: 1,
                supplyInTransit: 2,
                supplyPlanned: 3,
                inventoryBeginningOnHand: 4,
                demandPlanned: 5,
                dateGenerated: dateGenerated
            },
            {
                date: new Date("2020-01-01"),
                daysOut: 2,
                futureDateId: "future-date-id",
                inventoryEndingOnHand: 1,
                supplyInTransit: 2,
                supplyPlanned: 3,
                inventoryBeginningOnHand: 4,
                demandPlanned: 5,
                dateGenerated: dateGenerated
            }
        ];
        const mock = (db.getProjections = jest.fn().mockImplementationOnce((): RawProjection[] => {
            return [result2, result1];
        }) as any);
        const api = new GetProjectionApi(db);

        // act
        const response = await api.execute(`some/path/${item.id!}`, null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(item.id);
        expect(JSON.parse(response.body)["projections"]).toEqual(JSON.parse(JSON.stringify(expectedResponse)));
        expect(response.statusCode).toEqual(200);
    });

    it("should return 404 if projections are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const item: Item = {
            id: "item_id",
            sku: "test_sku1",
            amount: 5,
            userDefinedFields: `{"field_1": "field1_val" }`
        };

        const mock = (db.getProjections = jest.fn().mockImplementationOnce(() => {
            return null;
        }) as any);
        const api = new GetProjectionApi(db);

        // act
        const response = await api.execute(`some/path/${item.id!}`, null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(item.id);
        expect(response.statusCode).toEqual(404);
    });
});
