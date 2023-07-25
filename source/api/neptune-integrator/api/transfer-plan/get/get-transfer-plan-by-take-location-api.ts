// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { NeptuneDB } from "neptune/db/neptune-db";
import { EdgeDirection, EdgeLabel, VertexLabel } from "neptune/model/constants";
import { Item } from "neptune/model/item";
import { PathParser } from "util/pathParser";

import { TransferPlan } from "neptune/model/transfer-plan";
import Logger from "util/logger";

export class GetTransferPlanByTakeLocationApi implements ApiInterface {
    logger: Logger;
    static EXPECTED_PATH_PARTS = 4;
    db: NeptuneDB;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    async execute(path: string, _body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const locationId = PathParser.getLastItemInPath(path, GetTransferPlanByTakeLocationApi.EXPECTED_PATH_PARTS);
        const hops: [edgeLabel: EdgeLabel, edgeDirection: EdgeDirection][] = [
            [EdgeLabel.RESIDES, EdgeDirection.IN],
            [EdgeLabel.TAKES, EdgeDirection.IN]
        ];
        const transferPlans = (await this.db.getAllConnected_k_hop<TransferPlan>(
            VertexLabel.LOCATION,
            VertexLabel.TRANSFER_PLAN,
            locationId,
            hops
        )) as TransferPlan[];
        if (transferPlans !== undefined) {
            const transferPlansWithItems = [];
            for (const transferPlan of transferPlans) {
                const item = await this.getTakesItem(transferPlan.id as string);
                const givesLocation = await this.getGivesLocation(transferPlan.id as string);
                transferPlansWithItems.push({ transferPlan: transferPlan, item: item, givesLocation: givesLocation });
            }
            return apiResponses._200({ transferPlansWithItems: transferPlansWithItems });
        }
        return apiResponses._404();
    }

    async getTakesItem(transferPlanId: string): Promise<Item> {
        const hops: [edgeLabel: EdgeLabel, edgeDirection: EdgeDirection][] = [[EdgeLabel.TAKES, EdgeDirection.OUT]];
        const items = await this.db.getAllConnected_k_hop(
            VertexLabel.TRANSFER_PLAN,
            VertexLabel.ITEM,
            transferPlanId,
            hops
        );
        return items[0] as Item;
    }
    async getGivesLocation(transferPlanId: string): Promise<Location> {
        const hops: [edgeLabel: EdgeLabel, edgeDirection: EdgeDirection][] = [
            [EdgeLabel.GIVES, EdgeDirection.OUT],
            [EdgeLabel.RESIDES, EdgeDirection.OUT]
        ];
        const locations = await this.db.getAllConnected_k_hop(
            VertexLabel.TRANSFER_PLAN,
            VertexLabel.LOCATION,
            transferPlanId,
            hops
        );
        return locations[0] as Location;
    }
}
