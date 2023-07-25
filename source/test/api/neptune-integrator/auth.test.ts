// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import { Config } from "../../util/config";
import { CfProxy } from "../../proxy/cf-proxy";
import { ApiProxy } from "../../proxy/api-proxy";
import { customField } from "../../util/constants";
import { LocationType, VertexLabel } from "shared/neptune/model/constants";
import { getLocation, getTransferPlan } from "../../factory/model-factory";

jest.setTimeout(300000);

describe("authentication-api", () => {
    let config: Config;
    let cfProxy: CfProxy;
    let endpoint: string;
    let apiProxy: ApiProxy;

    beforeAll(async () => {
        config = new Config();
        cfProxy = new CfProxy(config);
        endpoint = await cfProxy.getApiEndpoint();
        apiProxy = new ApiProxy(config, endpoint, cfProxy, true);
    });

    test("Test CustomField Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test GetCustomFieldApi enforces authentications
        await expect(async () => {
            await apiProxy.getCustomFields(VertexLabel.LOCATION);
        }).rejects.toThrowError("Unauthorized");

        // Test PostCustomFieldApi enforces authentications
        await expect(async () => {
            await apiProxy.postCustomFields(VertexLabel.LOCATION, [customField], []);
        }).rejects.toThrowError("Unauthorized");
    });

    test("Test Exception Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test GetExceptionApi enforces authentications
        await expect(async () => {
            await apiProxy.getExceptions();
        }).rejects.toThrowError("Unauthorized");

        // Test GetExceptionByItemApi enforces authentications
        await expect(async () => {
            await apiProxy.getExceptionsByItem("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test GetExceptionByLocationApi enforces authentications
        await expect(async () => {
            await apiProxy.getExceptionsByLocation("some-id");
        }).rejects.toThrowError("Unauthorized");
    });

    test("Test Graph Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test GetGraphApi enforces authentications
        await expect(async () => {
            await apiProxy.getGraph();
        }).rejects.toThrowError("Unauthorized");
    });

    test("Test InventoryPlan Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test GetAllInventoryPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.getAllInventoryPlan();
        }).rejects.toThrowError("Unauthorized");

        // Test GetInventoryPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.getInventoryPlan("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test GetInventoryPlanByLocationApi enforces authentications
        await expect(async () => {
            await apiProxy.getInventoryPlanByLocation("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test PostInventoryPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.postInventoryPlan("some-id", {});
        }).rejects.toThrowError("Unauthorized");

        // Test PutInventoryPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.putInventoryPlan("some-id", {});
        }).rejects.toThrowError("Unauthorized");

        // Test DeleteInventoryPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.deleteInventoryPlan("some-id");
        }).rejects.toThrowError("Unauthorized");
    });

    test("Test Item Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test GetAllItemApi enforces authentications
        await expect(async () => {
            await apiProxy.getAllItem();
        }).rejects.toThrowError("Unauthorized");

        // Test GetItemApi enforces authentications
        await expect(async () => {
            await apiProxy.getItem("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test GetItemByLocationApi enforces authentications
        await expect(async () => {
            await apiProxy.getItemByLocation("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test PostItemApi enforces authentications
        await expect(async () => {
            await apiProxy.postItem("some-id", {});
        }).rejects.toThrowError("Unauthorized");

        // Test PutItemApi enforces authentications
        await expect(async () => {
            await apiProxy.putItem({});
        }).rejects.toThrowError("Unauthorized");

        // Test DeleteItemApi enforces authentications
        await expect(async () => {
            await apiProxy.deleteItem("some-id");
        }).rejects.toThrowError("Unauthorized");
    });

    test("Test ItemRecord Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test GetAllItemRecordApi enforces authentications
        await expect(async () => {
            await apiProxy.getAllItemRecord();
        }).rejects.toThrowError("Unauthorized");

        // Test GetItemRecordApi enforces authentications
        await expect(async () => {
            await apiProxy.getItemRecord("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test GetItemRecordByItemApi enforces authentications
        await expect(async () => {
            await apiProxy.getItemRecordsByItemId("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test DeleteItemRecordApi enforces authentications
        await expect(async () => {
            await apiProxy.deleteItemRecord("some-id");
        }).rejects.toThrowError("Unauthorized");
    });

    test("Test Location Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test GetAllLocationsApi enforces authentications
        await expect(async () => {
            await apiProxy.getAllLocation();
        }).rejects.toThrowError("Unauthorized");

        // Test GetLocationsApi enforces authentications
        await expect(async () => {
            await apiProxy.getLocation("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test GetLocationByTypeApi enforces authentications
        await expect(async () => {
            await apiProxy.getLocationByType(LocationType.DISTRIBUTOR);
        }).rejects.toThrowError("Unauthorized");

        // Test PostLocationApi enforces authentications
        await expect(async () => {
            await apiProxy.postLocation(getLocation(LocationType.DISTRIBUTOR));
        }).rejects.toThrowError("Unauthorized");

        // Test PutLocationApi enforces authentications
        await expect(async () => {
            await apiProxy.putLocation(getLocation(LocationType.DISTRIBUTOR));
        }).rejects.toThrowError("Unauthorized");

        // Test DeleteLocationApi enforces authentications
        await expect(async () => {
            await apiProxy.deleteLocation("some-id");
        }).rejects.toThrowError("Unauthorized");
    });
    test("Test Projection Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test PutTransferPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.getProjections("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test DeleteTransferPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.getFutureDates("some-id");
        }).rejects.toThrowError("Unauthorized");
    });

    test("Test TransferPlan Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test GetAllTransferPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.getAllTransferPlan();
        }).rejects.toThrowError("Unauthorized");

        // Test GetTransferPlanByGiveLocationApi enforces authentications
        await expect(async () => {
            await apiProxy.getTransferPlanByGiveLocation("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test GetTransferPlanByTakeLocationApi enforces authentications
        await expect(async () => {
            await apiProxy.getTransferPlanByTakeLocation("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test GetTransferPlanByLocationApi enforces authentications
        await expect(async () => {
            await apiProxy.getTransferPlanByLocation(LocationType.DISTRIBUTOR);
        }).rejects.toThrowError("Unauthorized");

        // Test PostTransferPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.postTransferPlan("some-id", "some-id", "sku", {});
        }).rejects.toThrowError("Unauthorized");

        // Test PutTransferPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.putTransferPlan({});
        }).rejects.toThrowError("Unauthorized");

        // Test DeleteTransferPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.deleteTransferPlan("some-id");
        }).rejects.toThrowError("Unauthorized");
    });

    test("Test Transfer Relationship Endpoints Enable Authentications| Failure | Fail with Unauthorized Error", async () => {
        // Test GetAllDownstreamTransferApi enforces authentications
        await expect(async () => {
            await apiProxy.getDownstreamTransfer("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test GetAllUpstreamTransferApi enforces authentications
        await expect(async () => {
            await apiProxy.getUpstreamTransfer("some-id");
        }).rejects.toThrowError("Unauthorized");

        // Test PostTransferApi enforces authentications
        await expect(async () => {
            await apiProxy.postTransfer("some-id", "some-id", "1");
        }).rejects.toThrowError("Unauthorized");

        // Test PutTransferPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.putTransfer("some-id", "some-id", "1");
        }).rejects.toThrowError("Unauthorized");

        // Test DeleteTransferPlanApi enforces authentications
        await expect(async () => {
            await apiProxy.deleteTransfer("some-id", "some-id");
        }).rejects.toThrowError("Unauthorized");
    });
});
