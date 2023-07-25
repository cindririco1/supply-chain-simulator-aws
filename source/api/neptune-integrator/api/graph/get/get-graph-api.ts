// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel, VertexLabel } from "neptune/model/constants";
import Logger from "util/logger";

export class GetGraphApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 3;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, _body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);

        const locations = await this.db.getAll(VertexLabel.LOCATION);
        const transfers = await this.db.getAllLabelConnectedEdges_k_hop(
            VertexLabel.LOCATION,
            EdgeLabel.TRANSFERS,
            EdgeDirection.OUT,
            []
        );
        if (locations !== undefined && transfers !== undefined) {
            return apiResponses._200({ locations: locations, transfers: transfers });
        }
        return apiResponses._404();
    }
}
