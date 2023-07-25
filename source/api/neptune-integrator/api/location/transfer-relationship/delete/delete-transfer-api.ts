// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeLabel, VertexLabel } from "neptune/model/constants";
import Logger from "util/logger";

export class DeleteTransferApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.debug(`Delete Transfer API : Body: ` + body);

        let fromLocationId: string;
        let toLocationId: string;
        try {
            const deleteTransferParameters = JSON.parse(body!);
            fromLocationId = deleteTransferParameters.fromLocationId;
            toLocationId = deleteTransferParameters.toLocationId;
        } catch (e) {
            this.logger.error(`Error parsing body: ${e}`);
            return apiResponses._400({
                message: "Could not parse delete transfer request body"
            });
        }

        const deleteResult = await this.db.deleteEdge(
            VertexLabel.LOCATION,
            fromLocationId,
            VertexLabel.LOCATION,
            toLocationId,
            EdgeLabel.TRANSFERS
        );
        return apiResponses._200({ success: deleteResult });
    }
}
