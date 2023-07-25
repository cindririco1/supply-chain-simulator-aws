// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { Vertex } from "shared/neptune/model/vertex";
import { EdgeDirection, EdgeLabel, TransferPlanStatus, VertexLabel } from "shared/neptune/model/constants";
import { convertInventoryPlan, convertItem, convertItemRecord, convertTransferPlan } from "../util/neptune-util";
import { Item } from "shared/neptune/model/item";
import { InventoryPlan } from "shared/neptune/model/inventory-plan";
import { TransferPlan } from "shared/neptune/model/transfer-plan";
import { ItemRecord } from "shared/neptune/model/item-record";
import { NeptuneMapType } from "shared/neptune/db/neptune-types";

export class NeptuneProxy {
    public neptuneDb: NeptuneDB;

    constructor(neptuneDb: NeptuneDB) {
        this.neptuneDb = neptuneDb;
    }

    /**
     * Query the neptune db to check if the plan exists.
     */
    public async hasPlan(id: string, label: string): Promise<boolean> {
        let plan;
        if (label === "inventory-plan") {
            plan = (await this.neptuneDb.getById(VertexLabel.INVENTORY_PLAN, id)) as
                | Map<string, NeptuneMapType>
                | InventoryPlan;
        } else {
            plan = (await this.neptuneDb.getById(VertexLabel.TRANSFER_PLAN, id)) as
                | Map<string, NeptuneMapType>
                | TransferPlan;
        }

        return plan !== undefined && plan !== null;
    }

    /**
     * Query the neptune db to fetch an inventory plan node by vertex id.
     */
    public async getInventoryPlan(id: string): Promise<InventoryPlan> {
        const inventoryPlan = (await this.neptuneDb.getById(VertexLabel.INVENTORY_PLAN, id)) as
            | Map<string, NeptuneMapType>
            | InventoryPlan;

        return convertInventoryPlan(inventoryPlan);
    }

    /**
     * Query the neptune db to fetch a transfer plan node by vertex id.
     */
    public async getTransferPlan(id: string): Promise<TransferPlan> {
        const transferPlan = (await this.neptuneDb.getById(VertexLabel.TRANSFER_PLAN, id)) as
            | Map<string, NeptuneMapType>
            | TransferPlan;

        return convertTransferPlan(transferPlan);
    }

    /**
     * Query the neptune db to fetch an item node by vertex id.
     */
    public async getItem(itemLabel: VertexLabel, itemId: string, edgeLabel: EdgeLabel): Promise<Item[]> {
        const hops: [edgeLabel: EdgeLabel, edgeDirection: EdgeDirection][] = [[edgeLabel, EdgeDirection.OUT]];

        const items = (await this.neptuneDb.getAllConnected_k_hop(itemLabel, VertexLabel.ITEM, itemId, hops)) as
            | Map<string, NeptuneMapType>[]
            | Item[];

        return items.map(item => convertItem(item));
    }

    /**
     * Update an item node by replacing it's vertex properties.
     */
    public async updateItem(item: Vertex) {
        await this.neptuneDb.updateVertex(VertexLabel.ITEM, item, true);
    }

    /**
     * Update an transfer plan node by replacing it's vertex properties.
     */
    public async updateTransferPlan(transferPlan: TransferPlan, status: TransferPlanStatus) {
        transferPlan.status = status;
        await this.neptuneDb.updateVertex(VertexLabel.TRANSFER_PLAN, transferPlan, true);
    }

    /**
     * Create an item record by using it's vertex properties.
     */
    public async createItemRecord(itemRecord: Vertex): Promise<Vertex> {
        const createdItemRecord = (await this.neptuneDb.createVertex(VertexLabel.ITEM_RECORD, itemRecord, true)) as
            | Map<string, NeptuneMapType>
            | ItemRecord;

        return convertItemRecord(createdItemRecord);
    }

    /**
     * Links an item record back to it's corresponding item with label "recorded".
     */
    public async linkItemRecord(itemRecordId: string, itemId: string) {
        await this.neptuneDb.createEdge(
            VertexLabel.ITEM,
            itemId,
            VertexLabel.ITEM_RECORD,
            itemRecordId,
            EdgeLabel.RECORDED,
            {},
            true
        );
    }
}
