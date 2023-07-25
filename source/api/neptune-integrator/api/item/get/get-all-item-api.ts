// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { isItem, Item } from "neptune/model/item";
import Logger from "util/logger";

export class GetAllItemApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);

        let parsedVertex: Item;
        let items;
        // This isn't currently relevent since this handles GET requests
        if (body != null) {
            try {
                parsedVertex = JSON.parse(body);
            } catch (e) {
                this.logger.error(`Error parsing body: ${e}`);
                return apiResponses._400({
                    message: "Could not parse inventory request"
                });
            }
            if (!isItem(parsedVertex, false, false)) {
                return apiResponses._400({
                    message: "Could not parse inventory request, unexpected properties found"
                });
            }
            items = await this.db.getAll(VertexLabel.ITEM, parsedVertex);
        } else {
            items = await this.db.getAll(VertexLabel.ITEM);
        }
        if (items !== undefined) {
            return apiResponses._200({ items: items });
        }
        return apiResponses._404();
    }
}
