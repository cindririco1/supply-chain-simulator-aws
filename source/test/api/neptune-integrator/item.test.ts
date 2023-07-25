// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, test, jest, afterAll } from "@jest/globals";
import { Config } from "../../util/config";
import { CfProxy } from "../../proxy/cf-proxy";
import { ApiProxy } from "../../proxy/api-proxy";
import { getItem, getLocation, getUpdatedItem } from "../../factory/model-factory";
import { logger } from "../../util/logger";
import { LocationType } from "shared/neptune/model/constants";

jest.setTimeout(300000);

const ITEM_AMOUNT = 1000;
const UPDATED_ITEM_AMOUNT = 900;
const ITEM_SKU = "some-sku100";

// tracked for deletion at the end
const locationIds: string[] = [];
const itemIds: string[] = [];
const itemRecordIds: string[] = [];

describe("Test Item APIs", () => {
    let config: Config;
    let cfProxy: CfProxy;
    let endpoint: string;
    let apiProxy: ApiProxy;

    beforeAll(async () => {
        config = new Config();
        cfProxy = new CfProxy(config);
        endpoint = await cfProxy.getApiEndpoint();
        apiProxy = new ApiProxy(config, endpoint, cfProxy);
    });

    afterAll(async () => {
        logger.info("Delete created item and item records");
        for (const locationId of locationIds) {
            await apiProxy.deleteLocation(locationId);
        }

        for (const itemId of itemIds) {
            await apiProxy.deleteItem(itemId);
        }

        for (const itemRecordId of itemRecordIds) {
            await apiProxy.deleteItemRecord(itemRecordId);
        }
    });

    /**
     * Scenario:
       Create a Location Vertex
       Create an item vertex
       Update the item's amount using PUT ITEM API
       Updating item, should create item records corresponding to amount change
       Get ItemRecords by itemID and verify itemRecord is created for the amount change
     */
    test("Updating item vertex, should create item records", async () => {
        // Create location
        const manufacturingLocationObject = getLocation(LocationType.MANUFACTURER);
        const manufacturingLocation = await apiProxy.postLocation(manufacturingLocationObject);
        locationIds.push(manufacturingLocation.id);

        // Create item vertex in Location
        const item = getItem(ITEM_SKU, ITEM_AMOUNT);
        const itemResponse = await apiProxy.postItem(manufacturingLocation.id, item);
        const itemId = itemResponse.id;
        itemIds.push(itemId);

        // Update item vertex
        const updatedItemObject = getUpdatedItem(itemId, ITEM_SKU, UPDATED_ITEM_AMOUNT);
        const updatedItemResponse = await apiProxy.putItem(updatedItemObject);
        expect(updatedItemResponse.success).toBeDefined();

        // Check item has the updated amount
        const updatedItem = await apiProxy.getItem(itemId);
        expect(updatedItem.amount).toBe(UPDATED_ITEM_AMOUNT);

        // Check item record created associated with item
        const itemRecords = await apiProxy.getItemRecordsByItemId(itemId);
        expect(itemRecords.length).toBe(1);
        const itemRecordCreatedItemUpdate = itemRecords[0];
        expect(itemRecordCreatedItemUpdate.id).toBeDefined();
        expect(itemRecordCreatedItemUpdate.fromAmount).toBe(ITEM_AMOUNT);
        expect(itemRecordCreatedItemUpdate.toAmount).toBe(UPDATED_ITEM_AMOUNT);
        itemRecordIds.push(itemRecordCreatedItemUpdate.id);
    });
});
