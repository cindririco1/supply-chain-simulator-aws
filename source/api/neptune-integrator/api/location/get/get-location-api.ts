// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";
export class GetLocationApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 3;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const locationId = PathParser.getLastItemInPath(path, GetLocationApi.EXPECTED_PATH_PARTS);

        const location = await this.db.getById(VertexLabel.LOCATION, locationId);
        if (location !== undefined) {
            return apiResponses._200({ location: location });
        }
        return apiResponses._404();
    }
}
