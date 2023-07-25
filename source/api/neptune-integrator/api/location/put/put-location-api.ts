// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { isLocation, Location } from "neptune/model/location";
import Logger from "util/logger";

export class PutLocationApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(isLocation, false, true)
    async execute(path: string, body: string | null, headers: object): Promise<ApiResponse> {
        const parsedVertex: Location = JSON.parse(body as string);
        const locationId = parsedVertex.id as string;
        const currLocation = (await this.db.getById(VertexLabel.LOCATION, locationId)) as Location;
        if (parsedVertex.type && currLocation.type !== parsedVertex.type) {
            return apiResponses._400({
                message: "Modifying location type is not allowed"
            });
        }
        if (!(await this.validateUniqueDescription(parsedVertex))) {
            this.logger.error("A location with same Description already exists.");
            return apiResponses._400({
                message: "A location with same Description already exists."
            });
        }
        const locationPutResult = await this.db.updateVertex(VertexLabel.LOCATION, parsedVertex);

        if (locationPutResult !== null) {
            return apiResponses._200({ location: locationPutResult });
        }
        return apiResponses._404();
    }

    async validateUniqueDescription(location: Location): Promise<boolean> {
        if (location.description !== undefined) {
            const locations = (await this.db.getAll<Location>(VertexLabel.LOCATION, {
                description: location.description
            } as Location)) as Location[];
            if (locations !== undefined && locations.length > 0) {
                for (const loc of locations) {
                    if (loc.id != location.id) return false;
                }
            }
        }
        return true;
    }
}
