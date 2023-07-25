// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { isLocation, Location } from "neptune/model/location";
import Logger from "util/logger";

export class DeleteLocationApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isLocation, false, true)
    async execute(path: string, body: string | null, headers: object): Promise<ApiResponse> {
        const parsedVertex: Location = JSON.parse(body as string);
        const deleteResult = await this.db.deleteById(VertexLabel.LOCATION, parsedVertex);
        return apiResponses._200({ success: deleteResult });
    }
}
