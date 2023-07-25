// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";
import { CustomFieldLabelSuffix } from "../constants";

export class GetCustomFieldApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;
    static EXPECTED_PATH_PARTS = 3;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const label = PathParser.getLastItemInPath(path, GetCustomFieldApi.EXPECTED_PATH_PARTS);
        const customFieldLabel = (label + CustomFieldLabelSuffix) as VertexLabel;

        const customFields = await this.db.getAll(customFieldLabel);

        if (customFields !== undefined) {
            return apiResponses._200({ customFields: customFields });
        }
        return apiResponses._404();
    }
}
