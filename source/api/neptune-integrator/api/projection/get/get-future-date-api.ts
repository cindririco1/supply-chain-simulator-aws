// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import Logger from "util/logger";

export class GetFutureDateApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 3;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, headers: object): Promise<ApiResponse> {
        return apiResponses._404();
    }
}
