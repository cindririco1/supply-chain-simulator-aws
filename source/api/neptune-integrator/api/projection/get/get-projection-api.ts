// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { Projection, RawProjection } from "neptune/model/projection";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";

export class GetProjectionApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 3;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, body: string | null, headers: object): Promise<ApiResponse> {
        const itemId = PathParser.getLastItemInPath(path, GetProjectionApi.EXPECTED_PATH_PARTS);

        const projectionsRaw = (await this.db.getProjections(itemId)) as RawProjection[];

        if (projectionsRaw != undefined) {
            const projections: Projection[] = projectionsRaw.map(rawProjection => {
                return {
                    date: rawProjection.futureDate.date,
                    daysOut: rawProjection.futureDate.daysOut,
                    futureDateId: rawProjection.futureDate.id,
                    inventoryEndingOnHand: rawProjection.projection.inventoryEndingOnHand,
                    supplyInTransit: rawProjection.projection.supplyInTransit,
                    supplyPlanned: rawProjection.projection.supplyPlanned,
                    inventoryBeginningOnHand: rawProjection.projection.inventoryBeginningOnHand,
                    demandPlanned: rawProjection.projection.demandPlanned,
                    dateGenerated: rawProjection.projection.dateGenerated
                };
            });

            projections.sort((a, b) => {
                return a.daysOut - b.daysOut;
            });

            if (projections != undefined) {
                return apiResponses._200({ projections: projections });
            }
        }

        return apiResponses._404();
    }
}
