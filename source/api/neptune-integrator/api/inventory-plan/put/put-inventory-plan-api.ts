// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel, VertexLabel } from "neptune/model/constants";
import { Edge } from "neptune/model/edge";
import { InventoryPlan, isInventoryPlan } from "neptune/model/inventory-plan";
import { Item } from "neptune/model/item";
import Logger from "util/logger";

export class PutInventoryPlanApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isInventoryPlan, false, true, ["inventoryPlan"])
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const parsedVertex = JSON.parse(body as string);
        const itemId = parsedVertex.itemId;
        const inventoryPlan = parsedVertex.inventoryPlan;
        inventoryPlan.itemId = itemId;

        let updateVertexResult: InventoryPlan | undefined;
        let edgeCreateResult: Edge | undefined;
        let edgeDeleted = false;
        const inventoryPlanId = inventoryPlan.id as string;
        const currInventoryPlan = (await this.db.getById(VertexLabel.INVENTORY_PLAN, inventoryPlanId)) as InventoryPlan;
        if (inventoryPlan.planType && currInventoryPlan.planType !== inventoryPlan.planType) {
            return apiResponses._400({ message: "Modifying Plan Type is not allowed" });
        }
        try {
            updateVertexResult = (await this.db.updateVertex(
                VertexLabel.INVENTORY_PLAN,
                inventoryPlan
            )) as InventoryPlan;
            if (itemId !== undefined) {
                const currentItemId = await this.getCurrentItemId(inventoryPlanId);
                if (currentItemId !== undefined && currentItemId != itemId) {
                    await this.db.deleteEdge(
                        VertexLabel.INVENTORY_PLAN,
                        inventoryPlanId,
                        VertexLabel.ITEM,
                        currentItemId,
                        EdgeLabel.UPDATES
                    );
                    edgeDeleted = true;
                    edgeCreateResult = await this.db.createEdge(
                        VertexLabel.INVENTORY_PLAN,
                        inventoryPlanId,
                        VertexLabel.ITEM,
                        itemId,
                        EdgeLabel.UPDATES,
                        {}
                    );
                    if (edgeCreateResult == null) {
                        return apiResponses._500({
                            message: "Encountered error updating inventory plan, item to plan relationship failed"
                        });
                    }
                }
            }
        } catch (e) {
            this.logger.error(`Error updating inventory plan: ${e}`);

            await this.restoreState(currInventoryPlan, updateVertexResult, inventoryPlanId, edgeDeleted);
            return apiResponses._500({
                message: "Encountered error updating inventory plan"
            });
        }
        this.db.commitTransaction();
        return apiResponses._200({ inventoryPlan: updateVertexResult, edge: edgeCreateResult });
    }

    /**
     * Not ideal way to handle rollbacks but Neptune transactions were not working well
     *
     * @param currentVertexResult Inventory plan in previous state
     * @param updateVertexResult Inventory plan post-update (if it happened)
     * @param inventoryPlanId Inventory plan id
     * @param edgeDeleted Whether or not the edge was deleted while updating
     */
    private async restoreState(
        currentVertexResult: InventoryPlan,
        updateVertexResult: InventoryPlan | undefined,
        inventoryPlanId: string,
        edgeDeleted: boolean
    ): Promise<void> {
        if (currentVertexResult && updateVertexResult) {
            await this.db.updateVertex(VertexLabel.INVENTORY_PLAN, currentVertexResult);
        }
        if (edgeDeleted) {
            const itemId = currentVertexResult.itemId;
            if (itemId) {
                await this.db.createEdge(
                    VertexLabel.INVENTORY_PLAN,
                    inventoryPlanId,
                    VertexLabel.ITEM,
                    itemId,
                    EdgeLabel.UPDATES,
                    {}
                );
            } else {
                this.logger.warn(
                    "Unable to revert edge for inventory plan because no item id found for current vertex result"
                );
            }
        }
    }

    async getCurrentItemId(inventoryPlanId: string): Promise<string> {
        const hops: [edgeLabel: EdgeLabel, edgeDirection: EdgeDirection][] = [[EdgeLabel.UPDATES, EdgeDirection.OUT]];
        const items = (await this.db.getAllConnected_k_hop<Item>(
            VertexLabel.INVENTORY_PLAN,
            VertexLabel.ITEM,
            inventoryPlanId,
            hops
        )) as Item[];
        return items[0].id as string;
    }
}
