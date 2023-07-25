// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, afterEach, describe, expect, jest, test } from "@jest/globals";
import { Config } from "../../util/config";
import { CfProxy } from "../../proxy/cf-proxy";
import { ApiProxy } from "../../proxy/api-proxy";
import { logger } from "../../util/logger";
import { getLocation } from "../../factory/model-factory";
import { LocationType } from "shared/neptune/model/constants";
import { Location } from "shared/neptune/model/location";
import { leadTime } from "../../util/constants";

jest.setTimeout(300000);

const locationIds: string[] = [];
const edges: Map<string, string> = new Map();

describe("graph-api", () => {
    let config: Config;
    let cfProxy: CfProxy;
    let endpoint: string;
    let apiProxy: ApiProxy;

    beforeAll(async () => {
        config = new Config();
        cfProxy = new CfProxy(config);
        endpoint = await cfProxy.getApiEndpoint();
        apiProxy = new ApiProxy(config, endpoint, cfProxy);
    });

    afterEach(async () => {
        logger.info("Delete created locaitons and transfers");

        for (const [fromLocationId, toLocationId] of edges) {
            await apiProxy.deleteTransfer(fromLocationId, toLocationId);
        }

        for (const locationId of locationIds) {
            await apiProxy.deleteLocation(locationId);
        }
    });

    test("Test get command for graph API | Success | Gets graph locations and transfers", async () => {
        // Get current locations and transfers
        const prevGraph = await apiProxy.getGraph();
        const prevGraphLocations: Location[] = prevGraph.locations;
        const prevGraphTransfers: any[] = prevGraph.transfers;

        // Add locations and transfers
        const manufacturingLocationObject = getLocation(LocationType.MANUFACTURER);
        const manufacturingLocation = await apiProxy.postLocation(manufacturingLocationObject);
        locationIds.push(manufacturingLocation.id);

        const distributingLocationObject = getLocation(LocationType.DISTRIBUTOR);
        const distributingLocation = await apiProxy.postLocation(distributingLocationObject);
        locationIds.push(distributingLocation.id);

        const sellingLocationObject = getLocation(LocationType.SELLER);
        const sellingLocation = await apiProxy.postLocation(sellingLocationObject);
        locationIds.push(sellingLocation.id);

        const transfer1 = await apiProxy.postTransfer(manufacturingLocation.id, distributingLocation.id, leadTime);
        const transfer2 = await apiProxy.postTransfer(distributingLocation.id, sellingLocation.id, leadTime);

        edges.set(transfer1.outV.id, transfer1.inV.id);
        edges.set(transfer2.outV.id, transfer2.inV.id);

        // Get all locations and transfers
        const postGraph = await apiProxy.getGraph();
        const postGraphLocations: Location[] = postGraph.locations;
        const postGraphTransfers: any[] = postGraph.transfers;

        // Compare new and old results to see if location and edges are created
        const filteredLocations = postGraphLocations.filter((postLocation) => !prevGraphLocations.some((prevLocation) => postLocation.id === prevLocation.id));
        expect(filteredLocations.length).toBe(3);
        console.log(JSON.stringify(postGraphTransfers[0].edge.id));
        const filteredTransfers = postGraphTransfers.filter((postTransfer) => !prevGraphTransfers.some((prevTransfer) => postTransfer.edge.id === prevTransfer.edge.id));
        expect(filteredTransfers.length).toBe(2);
    });
});
