// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Location } from "shared/neptune/model/location";
import { Item } from "shared/neptune/model/item";
import { InventoryPlan } from "shared/neptune/model/inventory-plan";
import { TransferPlan } from "shared/neptune/model/transfer-plan";
import { InventoryPlanType, LocationType } from "shared/neptune/model/constants";
import {
    amount,
    dailyRate,
    endDate,
    startDate,
    turnoverHour,
    updatedTurnoverHour,
    userDefinedFields
} from "../util/constants";
import { logger } from "../util/logger";

const uuidv4 = require("uuid/v4");

/**
 * Create a new location in order to be persisted into the neptune db.
 */
export function getLocation(type: LocationType): Location {
    // Location node's description field should be unique as per `PostLocationApi` required.
    const description = uuidv4();
    logger.info(`Creating location with description: ${description}`);

    return {
        description: description,
        type: type,
        userDefinedFields: userDefinedFields
    };
}

/**
 * Create a new item in order to be persisted into the neptune db.
 */
export function getItem(sku: string, itemAmount: number = amount): Item {
    // Item node's sku field should be unique as per `PostLocationApi` required.
    logger.info(`Creating item with sku: ${sku}`);

    return {
        sku: sku,
        amount: itemAmount,
        dateEntered: startDate,
        userDefinedFields: userDefinedFields
    };
}

/**
 * Create a updated item in order to be persisted into the neptune db.
 */
export function getUpdatedItem(itemId: string, sku: string, updatedAmount: number = amount): Item {
    logger.info(`Updating item with sku: ${sku}`);

    return {
        id: itemId,
        sku: sku,
        amount: updatedAmount,
        userDefinedFields: userDefinedFields
    };
}

/**
 * Create a new inventory plan in order to be persisted into the neptune db.
 */
export function getInventoryPlan(): InventoryPlan {
    return {
        startDate: startDate,
        endDate: endDate,
        turnoverHour: turnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: dailyRate
    };
}

/**
 * Create a updated inventory plan in order to be persisted into the neptune db.
 */
export function getUpdatedInventoryPlan(id: string): InventoryPlan {
    return {
        id: id,
        startDate: startDate,
        endDate: endDate,
        turnoverHour: updatedTurnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: dailyRate
    };
}

/**
 * Create a new transfer plan in order to be persisted into the neptune db.
 */
export function getTransferPlan(): TransferPlan {
    return {
        shipDate: startDate,
        arrivalDate: endDate,
        transferAmount: amount
    };
}
