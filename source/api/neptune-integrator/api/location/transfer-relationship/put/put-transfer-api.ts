// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import Logger from "util/logger";
import { EdgeDirection, EdgeLabel, TransferPlanStatus, VertexLabel } from "neptune/model/constants";
import { Edge } from "neptune/model/edge";
import dayjs = require("dayjs");

export class PutTransferApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        const parsedVertex = JSON.parse(body!);
        if (
            parsedVertex.fromLocationId === undefined ||
            parsedVertex.toLocationId === undefined ||
            parsedVertex.leadTime === undefined
        ) {
            this.logger.error(`Error parsing body: ${body}`);
            return apiResponses._400({
                message: "Transfer Properties could not be extracted from body"
            });
        }
        if (parsedVertex.leadTime <= 0) {
            return apiResponses._400({
                message: "Lead Time should be greater than 0"
            });
        }
        const fromLocationId = parsedVertex.fromLocationId;
        const toLocationId = parsedVertex.toLocationId;
        const leadTime = parsedVertex.leadTime;
        try {
            const edge = (await this.db.getEdgeBetweenVertices(EdgeDirection.OUT, fromLocationId, toLocationId)) as any;
            if (edge === null) {
                return apiResponses._500({
                    message: "Encountered error retrieving relationship for locations"
                });
            }

            const edgePutResult = await this.db.updateEdge(EdgeLabel.TRANSFERS, edge, {
                leadTime: leadTime
            });

            const transferPlans = (await this.db.getTransferplansBetweenTransferEdge(
                fromLocationId,
                toLocationId
            )) as any[];
            if (transferPlans === null) {
                return apiResponses._500({
                    message: "Encountered error retrieving transfer plans"
                });
            }

            for (const transferPlan of transferPlans) {
                if (
                    transferPlan.status === undefined ||
                    transferPlan.status === TransferPlanStatus.NEW ||
                    transferPlan.status === TransferPlanStatus.SCHEDULED
                ) {
                    const shipDate = transferPlan.shipDate;
                    transferPlan.arrivalDate = dayjs(shipDate).add(leadTime, "day").format("YYYY-MM-DD");
                }
                await this.db.updateVertex(VertexLabel.TRANSFER_PLAN, transferPlan);
            }

            return apiResponses._200({ edge: edgePutResult as Edge });
        } catch (e) {
            this.logger.error(`Error updating transfer: ${e}`);
            return apiResponses._500({
                message: "Encountered error updating transfer relationship"
            });
        }
    }
}
