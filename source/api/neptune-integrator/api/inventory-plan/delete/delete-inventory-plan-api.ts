// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { InventoryPlan, isInventoryPlan } from "neptune/model/inventory-plan";
import Logger from "util/logger";

export class DeleteInventoryPlanApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isInventoryPlan, false, true)
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const parsedVertex: InventoryPlan = JSON.parse(body as string);
        const deleteResult = await this.db.deleteById(VertexLabel.INVENTORY_PLAN, parsedVertex);
        return apiResponses._200({ success: deleteResult });
    }
}
