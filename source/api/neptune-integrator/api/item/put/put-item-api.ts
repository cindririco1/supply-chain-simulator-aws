// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel, VertexLabel } from "neptune/model/constants";
import { isItem, Item } from "neptune/model/item";
import { ItemRecord } from "neptune/model/item-record";
import { Location } from "neptune/model/location";
import { Vertex } from "neptune/model/vertex";
import Logger from "util/logger";
import { MAX_INT_VALUE } from "../../util";

export class PutItemApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    MANUAL_OVERRIDE = "manual";

    @validateBody(isItem, false, true)
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const parsedVertex: Item = JSON.parse(body as string);
        if (!(await this.validateUniqueSKU(parsedVertex))) {
            this.logger.error("An item with same SKU already resides in this location.");
            return apiResponses._400({
                message: "An item with same SKU already resides in this location."
            });
        } else if (parsedVertex.amount! > MAX_INT_VALUE) {
            return apiResponses._400({
                message: `Amount cannot exceed max value of ${MAX_INT_VALUE}`
            });
        }
        const itemId = parsedVertex.id as string;
        const currItem = (await this.db.getById(VertexLabel.ITEM, itemId)) as Item;
        const putResult = await this.db.updateVertex(VertexLabel.ITEM, parsedVertex);
        await this.addItemRecordIfNecessary(parsedVertex, currItem);
        return apiResponses._200({ success: putResult });
    }

    async addItemRecordIfNecessary(updatedItem: Item, currItem: Item): Promise<void> {
        if (!!updatedItem.amount && currItem.amount !== updatedItem.amount) {
            const itemRecord = await this.createItemRecord(updatedItem, currItem);
            await this.createItemRecordEdge(itemRecord.id!, updatedItem.id!);
        }
    }

    async validateUniqueSKU(item: Item): Promise<boolean> {
        if (!item.sku) {
            return true;
        }

        const locations = await this.db.getAllConnected<Location>(
            VertexLabel.ITEM,
            VertexLabel.LOCATION,
            item.id as string,
            EdgeDirection.OUT
        );

        const firstLocation = locations?.[0] as Location;

        if (!firstLocation) {
            return true;
        }

        const connectedItems = (await this.db.getAllConnected<Item>(
            VertexLabel.LOCATION,
            VertexLabel.ITEM,
            firstLocation.id as string,
            EdgeDirection.IN,
            { sku: item.sku } as Vertex
        )) as Item[];

        const hasDuplicate = connectedItems.some(connectedItem => connectedItem.id !== item.id);

        return !hasDuplicate;
    }

    async createItemRecordEdge(itemRecordId: string, itemId: string): Promise<void> {
        await this.db.createEdge(
            VertexLabel.ITEM,
            itemId,
            VertexLabel.ITEM_RECORD,
            itemRecordId,
            EdgeLabel.RECORDED,
            {},
            true
        );
    }

    async createItemRecord(updatedItem: Item, currItem: Item): Promise<ItemRecord> {
        const itemRecord = this.getItemRecord(updatedItem, currItem) as Vertex;
        return (await this.db.createVertex(VertexLabel.ITEM_RECORD, itemRecord)) as ItemRecord;
    }

    getItemRecord(updatedItem: Item, currItem: Item): ItemRecord {
        return {
            dateFrom: currItem.dateEntered!,
            dateTo: new Date(),
            fromAmount: currItem.amount!,
            toAmount: updatedItem.amount!,
            planId: this.MANUAL_OVERRIDE
        };
    }
}
