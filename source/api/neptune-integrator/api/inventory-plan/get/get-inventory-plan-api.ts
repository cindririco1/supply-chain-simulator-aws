// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";

export class GetInventoryPlanApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 3;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, _body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const inventoryPlanId = PathParser.getLastItemInPath(path, GetInventoryPlanApi.EXPECTED_PATH_PARTS);
        const inventoryPlan = await this.db.getById(VertexLabel.INVENTORY_PLAN, inventoryPlanId);
        if (inventoryPlan !== undefined) {
            return apiResponses._200({ inventoryPlan: inventoryPlan });
        }
        return apiResponses._404();
    }
}
