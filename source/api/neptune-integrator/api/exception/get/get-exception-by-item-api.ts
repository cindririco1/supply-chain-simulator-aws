// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";

export class GetExceptionByItemApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 4;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const itemId = PathParser.getLastItemInPath(path, GetExceptionByItemApi.EXPECTED_PATH_PARTS);

        const results = await this.db.getInvalidItems(undefined, itemId);
        if (results !== undefined) {
            return apiResponses._200({ results: results });
        }
        return apiResponses._404();
    }
}
