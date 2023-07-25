// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InventoryPlanInput, TransferPlanInput } from "../model/scheduler";
import { Item } from "shared/neptune/model/item";
import { EdgeLabel, InventoryPlanType } from "shared/neptune/model/constants";
import { ItemRecord } from "shared/neptune/model/item-record";
import { InventoryPlan } from "shared/neptune/model/inventory-plan";
import { TransferPlan } from "shared/neptune/model/transfer-plan";
import { getErrorMessage } from "./error-handling";
import { NeptuneMapType } from "shared/neptune/db/neptune-types";

/**
 * Generate a new inventory item based on original value and scheduler input.
 *
 * Note: All fields keep the same except amount field.
 */
export function getInventoryItem(item: Item, input: InventoryPlanInput): Item {
    const currentTimestamp = new Date();

    let amountChange = input.DailyRate;
    if (input.Type === InventoryPlanType.SALES) {
        amountChange = -input.DailyRate;
    }

    return {
        id: item.id,
        sku: item.sku,
        userDefinedFields: item.userDefinedFields,
        amount: item.amount! + amountChange,
        dateEntered: currentTimestamp
    };
}

/**
 * Generate a new transfer item based on original value and scheduler input.
 *
 * Note: All fields keep the same except amount field.
 */
export function getTransferItem(item: Item, input: TransferPlanInput, edgeLabel: EdgeLabel): Item {
    const currentTimestamp = new Date();
    let amount;
    switch (edgeLabel) {
        case EdgeLabel.TAKES:
            amount = item.amount! - input.Amount;
            break;
        case EdgeLabel.GIVES:
            amount = item.amount! + input.Amount;
            break;
        default:
            throw TypeError(`Invalid edge label: ${edgeLabel}`);
    }

    return {
        id: item.id,
        sku: item.sku,
        userDefinedFields: item.userDefinedFields,
        amount: amount,
        dateEntered: currentTimestamp
    };
}

/**
 * Generate an item record for historical recording purpose.
 */
export function getItemRecord(previousItem: Item, currentItem: Item, planId: string): ItemRecord {
    return {
        planId: planId,
        dateFrom: previousItem.dateEntered!,
        dateTo: currentItem.dateEntered!,
        fromAmount: previousItem.amount!,
        toAmount: currentItem.amount!
    };
}

/**
 * Convert types for raw inventory plan.
 */
export function convertInventoryPlan(inventoryPlan: Map<string, NeptuneMapType> | InventoryPlan): InventoryPlan {
    try {
        if (Object.hasOwn(inventoryPlan, "dailyRate")) {
            return inventoryPlan as InventoryPlan;
        } else {
            const fromEntries = Object.fromEntries(inventoryPlan as Map<string, NeptuneMapType>);
            return {
                startDate: fromEntries.startDate as Date,
                endDate: fromEntries.endDate as Date,
                turnoverHour: fromEntries.turnoverHour as number,
                planType: fromEntries.planType as string,
                dailyRate: fromEntries.dailyRate as number
            } as InventoryPlan;
        }
    } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Could not convert inventory plan: ${message}`);
    }
}

/**
 * Convert types for raw transfer plan.
 */
export function convertTransferPlan(transferPlan: Map<string, NeptuneMapType> | TransferPlan): TransferPlan {
    try {
        if (Object.hasOwn(transferPlan, "transferAmount")) {
            return transferPlan as TransferPlan;
        } else {
            const fromEntries = Object.fromEntries(transferPlan as Map<string, NeptuneMapType>);
            return {
                id: fromEntries.id as string,
                shipDate: fromEntries.shipDate as Date,
                arrivalDate: fromEntries.arrivalDate as Date,
                transferAmount: fromEntries.transferAmount as number
            } as TransferPlan;
        }
    } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Could not convert transfer plan: ${message}`);
    }
}

/**
 * Convert types for raw item.
 */
export function convertItem(item: Map<string, NeptuneMapType> | Item): Item {
    try {
        if (Object.hasOwn(item, "sku")) {
            return item as Item;
        } else {
            const fromEntries = Object.fromEntries(item as Map<string, NeptuneMapType>);
            return {
                id: fromEntries.id as string,
                sku: fromEntries.sku as string,
                amount: fromEntries.amount as number,
                dateEntered: fromEntries.dateEntered as Date,
                userDefinedFields: fromEntries.userDefinedFields as string
            } as Item;
        }
    } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Could not convert item: ${message}`);
    }
}

/**
 * Convert types for raw item record.
 */
export function convertItemRecord(itemRecord: Map<string, NeptuneMapType> | ItemRecord): ItemRecord {
    try {
        if (Object.hasOwn(itemRecord, "id")) {
            return itemRecord as ItemRecord;
        } else {
            const fromEntries = Object.fromEntries(itemRecord as Map<string, NeptuneMapType>);
            return {
                id: fromEntries.id as string
            } as ItemRecord;
        }
    } catch (error) {
        const message = getErrorMessage(error);
        throw new Error(`Could not convert item record: ${message}`);
    }
}
