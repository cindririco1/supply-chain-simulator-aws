// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeAll, describe, expect, jest, test } from "@jest/globals";
import { LocationType } from "shared/neptune/model/constants";
import { Location } from "shared/neptune/model/location";
import { getLocation } from "../../factory/model-factory";
import { ApiProxy } from "../../proxy/api-proxy";
import { CfProxy } from "../../proxy/cf-proxy";
import { Config } from "../../util/config";
import { leadTime, updatedLeadTime } from "../../util/constants";
import { logger } from "../../util/logger";

jest.setTimeout(300000);

const locationIds: string[] = [];
const edges: Map<string, string> = new Map();
const DESCRIPTION = "test-description";

describe("location-api", () => {
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

    test("Test CRUD operations for location API | Success | Gets, posts, updates, deletes a location", async () => {
        // Get current locations
        const prevLocations: Location[] = await apiProxy.getAllLocation();
        const prevManuLocations: Location[] = await apiProxy.getLocationByType(LocationType.MANUFACTURER);

        // Add locations
        const manufacturingLocationObject = getLocation(LocationType.MANUFACTURER);
        const manufacturingLocation = await apiProxy.postLocation(manufacturingLocationObject);
        locationIds.push(manufacturingLocation.id);

        const distributingLocationObject = getLocation(LocationType.DISTRIBUTOR);
        const distributingLocation = await apiProxy.postLocation(distributingLocationObject);
        locationIds.push(distributingLocation.id);

        const sellingLocationObject = getLocation(LocationType.SELLER);
        const sellingLocation = await apiProxy.postLocation(sellingLocationObject);
        locationIds.push(sellingLocation.id);

        // Get all locations
        const postLocations: Location[] = await apiProxy.getAllLocation();
        const postManuLocations: Location[] = await apiProxy.getLocationByType(LocationType.MANUFACTURER);

        // Compare new and old results to see if location are created
        const filteredLocations = postLocations.filter(
            postLocation => !prevLocations.some(prevLocation => postLocation.id === prevLocation.id)
        );
        expect(filteredLocations.length).toBe(3);
        const filteredManufacturers = postManuLocations.filter(
            postManuFacturer => !prevManuLocations.some(prevManuFacturer => postManuFacturer.id === prevManuFacturer.id)
        );
        expect(filteredManufacturers.length).toBe(1);

        // Update Manufacturing Location
        const locationParam = {
            id: manufacturingLocation.id,
            description: DESCRIPTION,
            type: LocationType.MANUFACTURER
        };
        const putResponse = await apiProxy.putLocation(locationParam);
        expect(putResponse.id).toBe(manufacturingLocation.id);

        // Get Manufacturing Location By Id
        const getLocationResponse = await apiProxy.getLocation(manufacturingLocation.id);
        expect(getLocationResponse.id).toBe(manufacturingLocation.id);
        expect(getLocationResponse.description).toBe(DESCRIPTION);
    });

    test("Test CRUD operations for transfer relationships | Success | Gets, posts, and deletes a location", async () => {
        const manufacturingLocationObject = getLocation(LocationType.MANUFACTURER);
        const manufacturingLocation = await apiProxy.postLocation(manufacturingLocationObject);
        locationIds.push(manufacturingLocation.id);

        const distributingLocationObject = getLocation(LocationType.DISTRIBUTOR);
        const distributingLocation = await apiProxy.postLocation(distributingLocationObject);
        locationIds.push(distributingLocation.id);

        const transfer = await apiProxy.postTransfer(manufacturingLocation.id, distributingLocation.id, leadTime);
        edges.set(transfer.outV.id, transfer.inV.id);

        const getDownstreamResponse: any[] = await apiProxy.getDownstreamTransfer(manufacturingLocation.id);
        expect(getDownstreamResponse.length).toBe(1);
        expect(getDownstreamResponse[0].id).toBe(distributingLocation.id);
        expect(getDownstreamResponse[0].leadTime).toBe(+leadTime);

        const getUpstreamResponse: any[] = await apiProxy.getUpstreamTransfer(distributingLocation.id);
        expect(getUpstreamResponse.length).toBe(1);
        expect(getUpstreamResponse[0].id).toBe(manufacturingLocation.id);
        expect(getUpstreamResponse[0].leadTime).toBe(+leadTime);

        await apiProxy.putTransfer(manufacturingLocation.id, distributingLocation.id, updatedLeadTime);

        const updatedGetDownstreamResponse: any[] = await apiProxy.getDownstreamTransfer(manufacturingLocation.id);
        expect(updatedGetDownstreamResponse.length).toBe(1);
        expect(updatedGetDownstreamResponse[0].id).toBe(distributingLocation.id);
        expect(updatedGetDownstreamResponse[0].leadTime).toBe(+updatedLeadTime);

        const updatedGetUpstreamResponse: any[] = await apiProxy.getUpstreamTransfer(distributingLocation.id);
        expect(updatedGetUpstreamResponse.length).toBe(1);
        expect(updatedGetUpstreamResponse[0].id).toBe(manufacturingLocation.id);
        expect(updatedGetUpstreamResponse[0].leadTime).toBe(+updatedLeadTime);
    });
});
