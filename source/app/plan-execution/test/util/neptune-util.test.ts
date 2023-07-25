// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, describe, test } from "@jest/globals";
import { getInventoryItem, getItemRecord, getTransferItem } from "../../src/util/neptune-util";
import {
    currentInventoryItem,
    id,
    inventoryPlanSchedule,
    previousInventoryItem,
    previousTransferItem,
    sku,
    transferPlanStartSchedule
} from "../helper/constants";
import { EdgeLabel, InventoryPlanType } from "shared/neptune/model/constants";
import { Item } from "shared/neptune/model/item";
import { ItemRecord } from "shared/neptune/model/item-record";

describe("Neptune Util", () => {
    test("will return correct inventory item", () => {
        const expectedAmount = previousInventoryItem.amount + inventoryPlanSchedule.DailyRate;

        const item: Item = getInventoryItem(previousInventoryItem, inventoryPlanSchedule);

        expect(item.id).toEqual(id);
        expect(item.amount).toEqual(expectedAmount);
        expect(item.dateEntered).toEqual(expect.any(Date));
        expect(item.sku).toEqual(sku);
        expect(item.userDefinedFields).toEqual("");
    });

    test("getInventoryItem | success | correct minused amount for item", () => {
        inventoryPlanSchedule.Type = InventoryPlanType.SALES;
        const expectedAmount = previousInventoryItem.amount - inventoryPlanSchedule.DailyRate;

        const item: Item = getInventoryItem(previousInventoryItem, inventoryPlanSchedule);

        expect(item.id).toEqual(id);
        expect(item.amount).toEqual(expectedAmount);
        expect(item.dateEntered).toEqual(expect.any(Date));
        expect(item.sku).toEqual(sku);
        expect(item.userDefinedFields).toEqual("");
    });

    test("will return correct transfer give item", () => {
        const expectedAmount = previousTransferItem.amount + transferPlanStartSchedule.Amount;

        const item: Item = getTransferItem(previousTransferItem, transferPlanStartSchedule, EdgeLabel.GIVES);

        expect(item.id).toEqual(id);
        expect(item.amount).toEqual(expectedAmount);
        expect(item.dateEntered).toEqual(expect.any(Date));
        expect(item.sku).toEqual(sku);
        expect(item.userDefinedFields).toEqual("");
    });

    test("will return correct transfer take item", () => {
        const expectedAmount = previousTransferItem.amount - transferPlanStartSchedule.Amount;

        const item: Item = getTransferItem(previousTransferItem, transferPlanStartSchedule, EdgeLabel.TAKES);

        expect(item.id).toEqual(id);
        expect(item.amount).toEqual(expectedAmount);
        expect(item.dateEntered).toEqual(expect.any(Date));
        expect(item.sku).toEqual(sku);
        expect(item.userDefinedFields).toEqual("");
    });

    test("will throw unexpected edge label type", () => {
        expect(() => getTransferItem(previousTransferItem, transferPlanStartSchedule, EdgeLabel.RECORDED)).toThrow(
            Error
        );
    });

    test("will return correct item record ", () => {
        const itemRecord: ItemRecord = getItemRecord(previousInventoryItem, currentInventoryItem, id);

        expect(itemRecord.dateFrom).toEqual(previousInventoryItem.dateEntered);
        expect(itemRecord.dateTo).toEqual(currentInventoryItem.dateEntered);
        expect(itemRecord.fromAmount).toEqual(previousInventoryItem.amount);
        expect(itemRecord.toAmount).toEqual(currentInventoryItem.amount);
        expect(itemRecord.planId).toEqual(id);
    });
});
