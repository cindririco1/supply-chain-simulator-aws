// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InventoryPlanInput, SchedulerInput, TransferPlanInput, TransferScheduleType } from "../model";
import { NeptuneProxy } from "../proxy/neptune-proxy";
import { getInventoryItem, getItemRecord, getTransferItem } from "../util/neptune-util";
import { EdgeLabel, TransferPlanStatus, VertexLabel } from "shared/neptune/model/constants";
import { Vertex } from "shared/neptune/model/vertex";
import { logger } from "../util/logger";

export class SchedulerHandler {
    public neptuneProxy;

    constructor(neptuneProxy: NeptuneProxy) {
        this.neptuneProxy = neptuneProxy;
    }

    public async handleSchedulerInput(input: SchedulerInput) {
        if ("DailyRate" in input) {
            // Inventory plan input
            const schedule = input as InventoryPlanInput;
            await this.handleInventoryPlanSchedule(schedule);
        } else {
            // Transfer plan input
            const schedule = input as TransferPlanInput;
            await this.handleTransferPlanSchedule(schedule);
        }
    }

    /**
     * Handles the Inventory Plan input:
     * 1. Query the neptune db to obtain an item vertex.
     * 2. Update the item vertex by:
     *    2 - a. change "dateEntered" to current lambda system timestamp.
     *    2 - b. add "dailyRate" to "amount"
     * 3. Create a new item record:
     *    3 - a. dateFrom: use the value of "dateEntered" field before update.
     *    3 - b. dateTo: use the value of "dateEntered" field after update.
     *    3 - c. amount: use the value of "amount" field before update.
     */
    public async handleInventoryPlanSchedule(schedule: InventoryPlanInput) {
        const items = await this.neptuneProxy.getItem(VertexLabel.INVENTORY_PLAN, schedule.Id, EdgeLabel.UPDATES);
        if (items === undefined) {
            throw Error(`Unable to find items for Inventory Plan: ${schedule.Id}`);
        }
        if (items.length > 1) {
            throw Error(`Find multiple item nodes for Inventory Plan: ${schedule.Id}`);
        }

        const item = items[0];
        const updatedItem = getInventoryItem(item, schedule);
        const itemRecord = getItemRecord(item, updatedItem, schedule.Id) as Vertex;

        await this.neptuneProxy.updateItem(updatedItem);
        logger.debug(`Updated item with payload: ${JSON.stringify(updatedItem)}`);

        const createdItemRecord = await this.neptuneProxy.createItemRecord(itemRecord);
        logger.debug(`Created item record with payload: ${JSON.stringify(createdItemRecord)}`);
        await this.neptuneProxy.linkItemRecord(createdItemRecord.id!, item.id!);
    }

    /**
     * Handles Transfer Plan input:
     * 1. Query the neptune db to obtain  item vertices (there should be 2)
     * 2. Update the item vertex by:
     *    2 - a. change "dateEntered" to current lambda system timestamp.
     *    2 - b. For "takes" edge item node: subtract "transferAmount" from "amount"
     *    2 - c. For "gives" edge item node: add "transferAmount" to "amount"
     * 3. Create a new item record:
     *    3 - a. dateFrom: use the value of "dateEntered" field before update.
     *    3 - b. dateTo: use the value of "dateEntered" field after update.
     *    3 - c. amount: use the value of "amount" field before update.
     */
    public async handleTransferPlanSchedule(schedule: TransferPlanInput) {
        const planId = schedule.Id;
        const scheduleType = schedule.Type;
        const plan = await this.neptuneProxy.getTransferPlan(planId);

        let edgeLabel: EdgeLabel;
        if (scheduleType === TransferScheduleType.SHIP) {
            edgeLabel = EdgeLabel.TAKES;
        } else {
            edgeLabel = EdgeLabel.GIVES;
        }

        const items = await this.neptuneProxy.getItem(VertexLabel.TRANSFER_PLAN, planId, edgeLabel);
        if (items === undefined) {
            throw Error(`Unable to find items for Transfer Plan: ${planId}`);
        }
        if (items.length > 1) {
            throw Error(`Find multiple item nodes for Transfer Plan: ${planId}`);
        }

        const item = items[0];
        const updatedItem = getTransferItem(item, schedule, edgeLabel);
        const itemRecord = getItemRecord(item, updatedItem, planId) as Vertex;

        await this.neptuneProxy.updateItem(updatedItem);
        logger.debug(`Updated ${edgeLabel} item with payload: ${JSON.stringify(updatedItem)}`);
        const createdItemRecord = await this.neptuneProxy.createItemRecord(itemRecord);
        logger.debug(`Created ${edgeLabel} item record with ${JSON.stringify(createdItemRecord)}`);
        await this.neptuneProxy.linkItemRecord(createdItemRecord.id!, item.id!);

        if (edgeLabel === EdgeLabel.TAKES) {
            await this.neptuneProxy.updateTransferPlan(plan, TransferPlanStatus.IN_TRANSIT);
        } else {
            await this.neptuneProxy.updateTransferPlan(plan, TransferPlanStatus.SUCCEED);
        }
    }
}
