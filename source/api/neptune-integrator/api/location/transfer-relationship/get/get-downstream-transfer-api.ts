// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, VertexLabel } from "neptune/model/constants";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";

export class GetAllDownstreamTransferApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 5;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const fromLocationId = PathParser.getLastItemInPath(path, GetAllDownstreamTransferApi.EXPECTED_PATH_PARTS);
        const locations = (await this.db.getAllConnected(
            VertexLabel.LOCATION,
            VertexLabel.LOCATION,
            fromLocationId,
            EdgeDirection.OUT
        )) as any[];

        if (locations !== undefined) {
            for (const location of locations) {
                const toLocationId = location.id!;
                const edge = (await this.db.getEdgeBetweenVertices(
                    EdgeDirection.OUT,
                    fromLocationId,
                    toLocationId
                )) as any;
                location["leadTime"] = edge.leadTime;
            }

            return apiResponses._200({ locations: locations });
        }
        return apiResponses._404();
    }
}
