// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel, TransferPlanStatus, VertexLabel } from "neptune/model/constants";
import { Item } from "neptune/model/item";
import { isTransferPlan, TransferPlan } from "neptune/model/transfer-plan";
import Logger from "util/logger";

export class PostTransferPlanApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isTransferPlan, true, false, ["transferPlan", "fromLocationId", "toLocationId", "sku"])
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const parsedVertex = JSON.parse(body as string);
        const fromLocationId: string = parsedVertex.fromLocationId;
        const toLocationId: string = parsedVertex.toLocationId;
        const sku: string = parsedVertex.sku;
        const transferPlan: TransferPlan = parsedVertex.transferPlan;
        if (!(await this.validateTransferEdgeExists(fromLocationId, toLocationId))) {
            const errorMessage = `A ${EdgeLabel.TRANSFERS} edge must exist between these two locations to allow the creation of a Transfer Plan.`;
            this.logger.error(errorMessage);
            return apiResponses._400({
                message: `${errorMessage} `
            });
        }
        const fromItemId = await this.getItemId(fromLocationId, sku);
        if (fromItemId === undefined) {
            return apiResponses._400({
                message: `No item found with SKU: ${sku} resides in Location:`,
                transfer: "fromLocation"
            });
        }
        const toItemId = await this.getItemId(toLocationId, sku);
        if (toItemId === undefined) {
            return apiResponses._400({
                message: `No item found with SKU: ${sku} resides in Location:`,
                transfer: "toLocation"
            });
        }
        transferPlan.fromItemId = fromItemId;
        transferPlan.toItemId = toItemId;
        // Assign a default value for transfer plan's status if it's unassigned yet.
        if (transferPlan.status === undefined) {
            transferPlan.status = TransferPlanStatus.NEW;
        }
        let transferPlanPostResult, givesEdgePostResult, takesEdgePostResult;
        try {
            transferPlanPostResult = (await this.db.createVertex<TransferPlan>(
                VertexLabel.TRANSFER_PLAN,
                transferPlan
            )) as TransferPlan;
            takesEdgePostResult = await this.db.createEdge(
                VertexLabel.TRANSFER_PLAN,
                transferPlanPostResult.id as string,
                VertexLabel.ITEM,
                fromItemId,
                EdgeLabel.TAKES,
                {}
            );

            if (takesEdgePostResult == null) {
                return apiResponses._500({
                    message: "Error creating transfer plan, transfer plan takes relationship failed"
                });
            }

            givesEdgePostResult = await this.db.createEdge(
                VertexLabel.TRANSFER_PLAN,
                transferPlanPostResult.id as string,
                VertexLabel.ITEM,
                toItemId,
                EdgeLabel.GIVES,
                {}
            );
            if (givesEdgePostResult == null) {
                return apiResponses._500({
                    message: "Error creating transfer plan, transfer plan gives relationship failed"
                });
            }
        } catch (e) {
            this.logger.error(`Error creating transfer plan: ${e} `);

            // no need to worry about deleting edge as this is automatically deleted by deleting one vertex
            if (transferPlanPostResult) {
                await this.db.deleteById(VertexLabel.TRANSFER_PLAN, transferPlanPostResult);
            }

            return apiResponses._400({
                message: `Error creating transfer plan`
            });
        }
        return apiResponses._200({
            transferPlan: transferPlanPostResult,
            takesEdge: takesEdgePostResult,
            givesEdge: givesEdgePostResult
        });
    }

    async validateTransferEdgeExists(fromLocationId: string, toLocationId: string): Promise<boolean> {
        const transferEdges = await this.db.getAllEdges(
            VertexLabel.LOCATION,
            fromLocationId,
            VertexLabel.LOCATION,
            toLocationId,
            EdgeDirection.OUT
        );
        if (transferEdges !== undefined && transferEdges.length > 0) {
            return true;
        }
        return false;
    }

    async getItemId(locationId: string, sku: string): Promise<string | undefined> {
        const hops: [edgeLabel: EdgeLabel, edgeDirection: EdgeDirection][] = [[EdgeLabel.RESIDES, EdgeDirection.IN]];
        const itemProps: Item = {
            sku: sku
        };
        const items = (await this.db.getAllConnected_k_hop<Item>(
            VertexLabel.LOCATION,
            VertexLabel.ITEM,
            locationId,
            hops,
            itemProps
        )) as Item[];
        if (items !== undefined && items.length === 1) {
            return items[0].id as string;
        }
        return undefined;
    }
}
