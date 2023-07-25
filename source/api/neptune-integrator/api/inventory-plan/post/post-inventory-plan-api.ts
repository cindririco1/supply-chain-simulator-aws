// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeLabel, VertexLabel } from "neptune/model/constants";
import { InventoryPlan, isInventoryPlan } from "neptune/model/inventory-plan";
import Logger from "util/logger";

export class PostInventoryPlanApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isInventoryPlan, true, false, ["inventoryPlan", "itemId"])
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const parsedVertex = JSON.parse(body as string);
        const itemId = parsedVertex.itemId;
        const inventoryPlan = parsedVertex.inventoryPlan;
        inventoryPlan.itemId = itemId;
        let inventoryPlanPostResult, edgePostResult;
        try {
            inventoryPlanPostResult = (await this.db.createVertex<InventoryPlan>(
                VertexLabel.INVENTORY_PLAN,
                inventoryPlan
            )) as InventoryPlan;
            edgePostResult = await this.db.createEdge(
                VertexLabel.INVENTORY_PLAN,
                inventoryPlanPostResult.id as string,
                VertexLabel.ITEM,
                itemId as string,
                EdgeLabel.UPDATES,
                {}
            );
            if (edgePostResult == null) {
                return apiResponses._500({
                    message: "Encountered error creating inventory plan, Item to Plan relationship failed to create"
                });
            }
        } catch (e) {
            this.logger.error(`Error creating inventory plan: ${e}`);

            // no need to worry about deleting edge as this is automatically deleted by deleting one vertex
            if (inventoryPlanPostResult) {
                await this.db.deleteById(VertexLabel.INVENTORY_PLAN, inventoryPlanPostResult);
            }
            return apiResponses._500({ message: "Encountered error creating inventory plan" });
        }

        return apiResponses._200({ inventoryPlan: inventoryPlanPostResult, edge: edgePostResult });
    }
}
