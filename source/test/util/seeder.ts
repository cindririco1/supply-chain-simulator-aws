// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiProxy } from "../proxy/api-proxy";
import {
    getInventoryPlan,
    getItem,
    getLocation,
    getTransferPlan,
    getUpdatedInventoryPlan
} from "../factory/model-factory";
import { LocationType } from "shared/neptune/model/constants";
import { isLocation } from "shared/neptune/model/location";
import { isItem } from "shared/neptune/model/item";
import { isInventoryPlan } from "shared/neptune/model/inventory-plan";
import { logger } from "./logger";
import { isTransferPlan } from "../../shared/neptune/model/transfer-plan";
import { InventoryPlanSeederResponse, leadTime, TransferPlanSeederResponse } from "./constants";

const uuidv4 = require('uuid/v4');

export class Seeder {
    private readonly apiProxy: ApiProxy;

    constructor(apiProxy: ApiProxy) {
        this.apiProxy = apiProxy;
    }

    /**
     * Seed location, item and inventory plan into neptune for plan execution integration test - inventory plan.
     */
    public async persistInventoryPlanForPlanExecution(): Promise<InventoryPlanSeederResponse> {
        // Persist an location node.
        const location = getLocation(LocationType.MANUFACTURER);
        if (!isLocation(location, true, false))  {
            logger.error("Unable to publish location to neptune, please check the request body");
        }
        const createdLocation = await this.apiProxy.postLocation(location);
        const locationId = createdLocation.id;

        // Persist an item node.
        const sku = uuidv4();
        const item = getItem(sku);
        if (!isItem(item, true, false))  {
            logger.error("Unable to publish item to neptune, please check the request body");
        }
        const createdItem = await this.apiProxy.postItem(locationId, item);
        const itemId = createdItem.id;

        // Persist an inventory plan node.
        const plan = getInventoryPlan();
        if (!isInventoryPlan(plan, true, false))  {
            logger.error("Unable to publish inventory plan to neptune, please check the request body");
        }
        const createdPlan = await this.apiProxy.postInventoryPlan(itemId, plan);
        const planId = createdPlan.id;

        return {
            locationId: locationId,
            itemId: itemId,
            planId: planId
        };
    }

    /**
     * Seed location, item, transfer and transfer plan into neptune for plan execution integration test - transfer plan.
     */
    public async persistTransferPlanForPlanExecution(): Promise<TransferPlanSeederResponse> {
        // Persist two location nodes.
        const fromLocation = getLocation(LocationType.MANUFACTURER);
        if (!isLocation(fromLocation, true, false)) {
            logger.error("Unable to publish location to neptune, please check the request body");
        }
        const createdFromLocation = await this.apiProxy.postLocation(fromLocation);
        const fromLocationId = createdFromLocation.id;

        const toLocation = getLocation(LocationType.SELLER);
        if (!isLocation(toLocation, true, false)) {
            logger.error("Unable to publish location to neptune, please check the request body");
        }
        const createdToLocation = await this.apiProxy.postLocation(toLocation);
        const toLocationId = createdToLocation.id;

        // Persist two item nodes.
        const sku = uuidv4();
        const fromItem = getItem(sku);
        if (!isItem(fromItem, true, false))  {
            logger.error("Unable to publish item to neptune, please check the request body");
        }
        const createdFromItem = await this.apiProxy.postItem(fromLocationId, fromItem);
        const fromItemId = createdFromItem.id;

        const toItem = getItem(sku);
        if (!isItem(toItem, true, false))  {
            logger.error("Unable to publish item to neptune, please check the request body");
        }
        const createdToItem = await this.apiProxy.postItem(toLocationId, toItem);
        const toItemId = createdToItem.id;

        // Persist an transfer edge
        await this.apiProxy.postTransfer(fromLocationId, toLocationId, leadTime);

        // Persist an transfer plan node.
        const plan = getTransferPlan();
        if (!isTransferPlan(plan, true, false))  {
            logger.error("Unable to publish transfer plan to neptune, please check the request body");
        }
        const createdPlan = await this.apiProxy.postTransferPlan(fromLocationId, toLocationId, sku, plan);
        const planId = createdPlan.id;

        return {
            fromLocationId: fromLocationId,
            toLocationId: toLocationId,
            fromItemId: fromItemId,
            toItemId: toItemId,
            planId: planId
        };
    }

    /**
     * Update InventoryPlan by changing the turnoverHour field.
     */
    public async updateInventoryPlan(itemId: string, inventoryPlanId: string){
        const plan = getUpdatedInventoryPlan(inventoryPlanId);
        if (!isInventoryPlan(plan, true, true))  {
            logger.error("Unable to publish inventory plan to neptune, please check the request body");
        }

        await this.apiProxy.putInventoryPlan(itemId, plan);
    }

    /**
     * Clean up the data which was inserted into the neptune db for integration test.
     */
    public async cleanUpForInventoryPlanExecution(response: InventoryPlanSeederResponse) {
        // Delete the location node.
        await this.apiProxy.deleteLocation(response.locationId);

        // Delete the item node.
        await this.apiProxy.deleteItem(response.itemId);

        // Delete the inventory plan node.
        await this.apiProxy.deleteInventoryPlan(response.planId);
    }

    /**
     * Clean up the data which was inserted into the neptune db for integration test.
     */
    public async cleanUpForTransferPlanExecution(response: TransferPlanSeederResponse) {
        // Delete the location nodes.
        await this.apiProxy.deleteLocation(response.fromLocationId);
        await this.apiProxy.deleteLocation(response.toLocationId);

        // Delete the item nodes.
        await this.apiProxy.deleteItem(response.fromItemId);
        await this.apiProxy.deleteItem(response.toItemId);

        // Delete the transfer plan node.
        await this.apiProxy.deleteTransferPlan(response.planId);
    }
}
