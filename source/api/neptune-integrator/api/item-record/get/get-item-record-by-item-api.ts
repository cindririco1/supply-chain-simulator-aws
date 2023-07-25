// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel } from "neptune/model/constants";
import { ItemRecord } from "neptune/model/item-record";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";
export class GetItemRecordByItemApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 4;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const itemId = PathParser.getLastItemInPath(path, GetItemRecordByItemApi.EXPECTED_PATH_PARTS);
        const itemRecords = (await this.db.getEdgeVertex<ItemRecord>(
            itemId,
            EdgeLabel.RECORDED,
            EdgeDirection.OUT
        )) as ItemRecord[];
        if (itemRecords !== undefined) {
            return apiResponses._200({ itemRecords: itemRecords });
        }
        return apiResponses._404();
    }
}
