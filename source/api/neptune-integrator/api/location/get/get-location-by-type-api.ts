// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { Vertex } from "neptune/model/vertex";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";
export class GetLocationByTypeApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 4;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const locationType = PathParser.getLastItemInPath(path, GetLocationByTypeApi.EXPECTED_PATH_PARTS);
        const locations = await this.db.getAll(VertexLabel.LOCATION, { type: locationType } as Vertex);
        if (locations !== undefined) {
            return apiResponses._200({ locations: locations });
        }
        return apiResponses._404();
    }
}
