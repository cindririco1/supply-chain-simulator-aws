// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetTransferPlanByGiveLocationApi } from "../../../../api/transfer-plan/get/get-transfer-plan-by-give-location-api";
import { TransferPlan } from "neptune/model/transfer-plan";
import { EdgeDirection, VertexLabel, EdgeLabel, LocationType } from "neptune/model/constants";
import { Item } from "neptune/model/item";
import { Location } from "neptune/model/location";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getTransferPlanByGiveLocationApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetTransferPlanByGiveLocationApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const transferPlanId = "test_transfer_plan_id";
        const locationId = "test_location_id";
        const transferPlan: TransferPlan = {
            id: transferPlanId,
            shipDate: new Date(),
            arrivalDate: new Date(),
            transferAmount: 5
        };

        const mockgetAllConnected_k_hop = (db.getAllConnected_k_hop = jest.fn().mockImplementationOnce(async () => {
            return [transferPlan];
        }) as any);

        const item: Item = {
            id: "item_id",
            sku: "test_sku1",
            amount: 5,
            userDefinedFields: `{"field_1": "field1_val" }`
        };

        const location: Location = {
            id: "location_id",
            description: "test_description",
            type: LocationType.MANUFACTURER,
            userDefinedFields: `{"field_1": "field1_val" }`
        };

        const api = new GetTransferPlanByGiveLocationApi(db);

        const mockgetGivesItem = (api.getGivesItem = jest.fn().mockImplementationOnce(async () => {
            return item;
        }) as any);

        const mockgetTakesLocation = (api.getTakesLocation = jest.fn().mockImplementationOnce(async () => {
            return location;
        }) as any);

        const hops: [edgeLabel: EdgeLabel, edgeDirection: EdgeDirection][] = [
            [EdgeLabel.RESIDES, EdgeDirection.IN],
            [EdgeLabel.GIVES, EdgeDirection.IN]
        ];

        // act
        const result = await api.execute(`GET /transfer-plan/gives/${locationId}`, "", {});

        // assert
        expect(mockgetAllConnected_k_hop).toHaveBeenCalledTimes(1);
        expect(mockgetGivesItem).toHaveBeenCalledTimes(1);
        expect(mockgetTakesLocation).toHaveBeenCalledTimes(1);
        expect(mockgetAllConnected_k_hop).toHaveBeenCalledWith(
            VertexLabel.LOCATION,
            VertexLabel.TRANSFER_PLAN,
            locationId,
            hops
        );
        expect(JSON.parse(result.body)["transferPlansWithItems"][0]["transferPlan"]).toEqual(
            JSON.parse(JSON.stringify(transferPlan))
        );
        expect(JSON.parse(result.body)["transferPlansWithItems"][0]["item"]).toEqual(JSON.parse(JSON.stringify(item)));
        expect(JSON.parse(result.body)["transferPlansWithItems"][0]["takesLocation"]).toEqual(
            JSON.parse(JSON.stringify(location))
        );
    });

    it("should return 404 if items are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const locationId = "1234";
        const mock = (db.getAllConnected_k_hop = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetTransferPlanByGiveLocationApi(db);

        // act
        const result = await api.execute(`GET /transfer-plan/gives/${locationId}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
