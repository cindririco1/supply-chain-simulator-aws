// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";

export class GetTransferPlanByLocationApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 3;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, _body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const locationId = PathParser.getLastItemInPath(path, GetTransferPlanByLocationApi.EXPECTED_PATH_PARTS);

        const fromTransferPlans = await this.db.getTransferPlans(locationId, true);
        const toTransferPlans = await this.db.getTransferPlans(locationId, false);
        const allTransferPlans = [...(fromTransferPlans || []), ...(toTransferPlans || [])];
        return apiResponses._200({ transferPlans: allTransferPlans });
    }
}
