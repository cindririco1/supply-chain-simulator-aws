// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { isTransferPlan, TransferPlan } from "neptune/model/transfer-plan";
import Logger from "util/logger";

export class PutTransferPlanApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isTransferPlan, false, true, ["transferPlan"])
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const transferPlan: TransferPlan = JSON.parse(body as string).transferPlan;
        let updateVertexResult;
        try {
            updateVertexResult = await this.db.updateVertex(VertexLabel.TRANSFER_PLAN, transferPlan);
        } catch (e) {
            this.logger.error(`Error updating transfer plan: ${e}`);
            return apiResponses._500({
                message: "Encountered error updating transfer plan"
            });
        }
        return apiResponses._200({ transferPlan: updateVertexResult });
    }
}
