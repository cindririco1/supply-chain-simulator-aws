// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel, LocationType, VertexLabel } from "neptune/model/constants";
import { Edge } from "neptune/model/edge";
import { Location } from "neptune/model/location";
import Logger from "util/logger";

export class PostTransferApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.debug(`Post Transfer API : Body: ` + body);

        const parsedVertex = JSON.parse(body!);
        if (
            parsedVertex.fromLocationId === undefined ||
            parsedVertex.toLocationId === undefined ||
            parsedVertex.leadTime === undefined
        ) {
            this.logger.error(`Error parsing body: ${body}`);
            return apiResponses._400({
                message: "Transfer Properties could not be extracted from body"
            });
        }
        if (parsedVertex.leadTime <= 0) {
            return apiResponses._400({
                message: "Lead Time should be greater than 0"
            });
        }
        const fromLocationId = parsedVertex.fromLocationId;
        const toLocationId = parsedVertex.toLocationId;
        const leadTime = parsedVertex.leadTime;
        try {
            const [valid, errorMessage] = await this.validateTransferRule(fromLocationId, toLocationId);
            if (!valid) {
                return apiResponses._400({
                    message: `${errorMessage}`
                });
            }
            const edgePostResult = await this.db.createEdge(
                VertexLabel.LOCATION,
                fromLocationId,
                VertexLabel.LOCATION,
                toLocationId,
                EdgeLabel.TRANSFERS,
                {
                    leadTime: leadTime
                }
            );
            return apiResponses._200({ edge: edgePostResult as Edge });
        } catch (e) {
            this.logger.error(`Error creating transfer: ${e}`);
            return apiResponses._500({
                message: "Encountered error creating transfer"
            });
        }
    }

    async validateTransferRule(fromLocationId: string, toLocationId: string): Promise<[boolean, string]> {
        const fromLocation = (await this.db.getById<Location>(VertexLabel.LOCATION, fromLocationId)) as Location;
        let errorMessage = "";
        if (fromLocation !== undefined) {
            // Seller can not transfer to anyone
            if (fromLocation.type == LocationType.SELLER) {
                errorMessage = "Seller can not transfer to anyone";
                this.logger.error(errorMessage);
                return [false, errorMessage];
            }
        }

        const toLocation = (await this.db.getById<Location>(VertexLabel.LOCATION, toLocationId)) as Location;
        if (toLocation !== undefined) {
            // No one can transfer to Manufacturer
            if (toLocation.type == LocationType.MANUFACTURER) {
                errorMessage = "No one can transfer to Manufacturer";
                this.logger.error(errorMessage);
                return [false, errorMessage];
            }
        }

        const transferEdges = await this.db.getAllEdges(
            VertexLabel.LOCATION,
            fromLocationId,
            VertexLabel.LOCATION,
            toLocationId,
            EdgeDirection.OUT
        );
        // Only one transfers edge between two locations
        if (transferEdges !== undefined && transferEdges.length > 0) {
            errorMessage = "Only one transfer edge between two locations is allowed";
            this.logger.error(errorMessage);
            return [false, errorMessage];
        }

        if (fromLocationId === toLocationId) {
            errorMessage = "A location can not transfer to itself";
            this.logger.error(errorMessage);
            return [false, errorMessage];
        }
        const paths = await this.db.getPathBetweenVertices(
            VertexLabel.LOCATION,
            toLocationId,
            VertexLabel.LOCATION,
            fromLocationId,
            EdgeDirection.OUT
        );
        // transfers edges can not create a cycle
        if (paths !== undefined && paths !== null) {
            errorMessage = "Transfer edges can not create a cycle";
            this.logger.error(errorMessage);
            return [false, errorMessage];
        }
        return [true, errorMessage];
    }
}
