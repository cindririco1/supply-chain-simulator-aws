// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel, VertexLabel } from "neptune/model/constants";
import { isItem, Item } from "neptune/model/item";
import { Vertex } from "neptune/model/vertex";
import Logger from "util/logger";
import { MAX_INT_VALUE } from "../../util";

export class PostItemApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isItem, true, false, ["item", "locationId"])
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const parsedVertex = JSON.parse(body as string);
        const locationId = parsedVertex.locationId;
        const item = parsedVertex.item;
        item.dateEntered = new Date();
        if (!(await this.validateUniqueSKU(item, locationId))) {
            this.logger.error("An item with same SKU already resides in this location.");
            return apiResponses._400({
                message: "An item with same SKU already resides in this location."
            });
        } else if (item.amount > MAX_INT_VALUE) {
            return apiResponses._400({
                message: `Amount cannot exceed max value of ${MAX_INT_VALUE}`
            });
        }
        let itemPostResult, edgePostResult;
        try {
            itemPostResult = (await this.db.createVertex<Item>(VertexLabel.ITEM, item)) as Item;
            edgePostResult = await this.db.createEdge(
                VertexLabel.ITEM,
                itemPostResult.id as string,
                VertexLabel.LOCATION,
                locationId as string,
                EdgeLabel.RESIDES,
                {}
            );
            if (edgePostResult == null) {
                return apiResponses._500({
                    message: "Encountered error creating item, Item to Location relationship failed"
                });
            }
        } catch (e) {
            this.logger.error(`Error creating item: ${e}`);

            // no need to worry about deleting edge as this is automatically deleted by deleting one vertex
            if (itemPostResult) {
                await this.db.deleteById(VertexLabel.ITEM, itemPostResult);
            }

            return apiResponses._500({
                message: "Encountered error creating item"
            });
        }

        return apiResponses._200({ item: itemPostResult, edge: edgePostResult });
    }

    async validateUniqueSKU(item: Item, locationId: string): Promise<boolean> {
        const items = await this.db.getAllConnected(
            VertexLabel.LOCATION,
            VertexLabel.ITEM,
            locationId,
            EdgeDirection.IN,
            { sku: item.sku } as Vertex
        );
        if (items !== undefined && items.length > 0) {
            return false;
        }
        return true;
    }
}
