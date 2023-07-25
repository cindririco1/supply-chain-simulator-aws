// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { TransferPlanStatus, VertexLabel } from "neptune/model/constants";
import { isTransferPlan, TransferPlan } from "neptune/model/transfer-plan";
import Logger from "util/logger";

export class DeleteTransferPlanApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isTransferPlan, false, true)
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const parsedVertex: TransferPlan = JSON.parse(body as string);

        const transferPlanId = parsedVertex.id as string;
        const transferPlan = (await this.db.getById(VertexLabel.TRANSFER_PLAN, transferPlanId)) as TransferPlan;
        if (transferPlan.status && transferPlan.status === TransferPlanStatus.IN_TRANSIT) {
            return apiResponses._400({
                message: "Editing an in-transit transfer plan is not allowed"
            });
        }

        const deleteResult = await this.db.deleteById(VertexLabel.TRANSFER_PLAN, parsedVertex);
        return apiResponses._200({ success: deleteResult });
    }
}
