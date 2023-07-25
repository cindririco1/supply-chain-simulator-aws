// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { ItemRecord } from "neptune/model/item-record";
import Logger from "util/logger";

export class GetAllItemRecordApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);

        let parsedVertex: ItemRecord;
        let itemRecords;
        // This isn't currently relevent since this handles GET requests
        if (body != null) {
            try {
                parsedVertex = JSON.parse(body);
            } catch (e) {
                this.logger.error(`Error parsing body: ${e}`);
                return apiResponses._400({
                    message: "Could not parse item record request body"
                });
            }
            itemRecords = await this.db.getAll(VertexLabel.ITEM_RECORD, parsedVertex);
        } else {
            itemRecords = await this.db.getAll(VertexLabel.ITEM_RECORD);
        }
        if (itemRecords !== undefined) {
            return apiResponses._200({ itemRecords: itemRecords });
        }
        return apiResponses._404();
    }
}
