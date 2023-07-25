// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { isLocation, Location } from "neptune/model/location";
import { Vertex } from "neptune/model/vertex";
import Logger from "util/logger";

export class PostLocationApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isLocation, true, false)
    async execute(path: string, body: string | null, headers: object): Promise<ApiResponse> {
        const parsedVertex: Location = JSON.parse(body as string);
        if (!(await this.validateUniqueDescription(parsedVertex))) {
            this.logger.error("A location with same Description already exists.");
            return apiResponses._400({
                message: "A location with same Description already exists."
            });
        }
        const locationPostResult = await this.db.createVertex(VertexLabel.LOCATION, parsedVertex);

        return apiResponses._200({ location: locationPostResult });
    }

    async validateUniqueDescription(location: Location): Promise<boolean> {
        const locations = await this.db.getAll(VertexLabel.LOCATION, {
            description: location.description
        } as Vertex);
        if (locations !== undefined && locations.length > 0) {
            return false;
        }
        return true;
    }
}
