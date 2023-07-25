// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { isItemRecord, ItemRecord } from "neptune/model/item-record";
import Logger from "util/logger";

export class DeleteItemRecordApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isItemRecord, false, true)
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const parsedVertex: ItemRecord = JSON.parse(body as string);
        const deleteResult = await this.db.deleteById(VertexLabel.ITEM_RECORD, parsedVertex);
        return apiResponses._200({ success: deleteResult });
    }
}
