// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, test, jest, afterAll } from "@jest/globals";
import { Config } from "../util/config";
import { CfProxy } from "../proxy/cf-proxy";
import { ApiProxy } from "../proxy/api-proxy";
import { InventoryPlan } from "shared/neptune/model/inventory-plan";
import { delay, leadTime } from "../util/constants";
import { InventoryPlanType, LocationType } from "shared/neptune/model/constants";
import { TransferPlan } from "shared/neptune/model/transfer-plan";
import { Projection } from "shared/neptune/model/projection";
import { getItem, getLocation } from "../factory/model-factory";
import { logger } from "../util/logger";
import { Item } from "shared/neptune/model/item";

jest.setTimeout(1000000);

interface TestProjection {
    inventoryEndingOnHand: number;
    daysOut: number;
}

const startingItemAmount = 1000000;
const sleepTime = 60000;
const sku = "some-sku";

// tracked for deletion at the end
const locationIds: string[] = [];
const itemIds: string[] = [];
const inventoryPlanIds: string[] = [];
const transferPlanIds: string[] = [];

function getDate(daysNum: number): Date {
    return new Date(new Date().getTime() + daysNum * 24 * 60 * 60 * 1000);
}

async function createInventoryPlan(apiProxy: ApiProxy, turnoverHour: number, itemId: string) {
    logger.info("Creating Inventory Plans");
    const startLastDayEndAfter: InventoryPlan = {
        startDate: getDate(10),
        endDate: getDate(13),
        turnoverHour: turnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: 1000000
    };
    const response = await apiProxy.postInventoryPlan(itemId, startLastDayEndAfter);
    inventoryPlanIds.push(response.id);
}

async function createTransferPlan(
    apiProxy: ApiProxy,
    transferAmount: number,
    testingLocationId: string,
    takingLocationId: string
) {
    logger.info("Creating Transfer Plans");
    const startLastDayEndAfter: TransferPlan = {
        // taking
        shipDate: getDate(15),
        arrivalDate: getDate(25),
        transferAmount: transferAmount
    };
    const response = await apiProxy.postTransferPlan(testingLocationId, takingLocationId, sku, startLastDayEndAfter);
    transferPlanIds.push(response.id);
}

function checkInitialInventoryPlanProjections(projections: Projection[]) {
    logger.info("Checking projections results");

    const expectedProjections = [
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 1
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 2
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 3
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 4
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 5
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 6
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 7
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 8
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 9
        },
        {
            inventoryEndingOnHand: 2000000,
            daysOut: 10
        },
        {
            inventoryEndingOnHand: 3000000,
            daysOut: 11
        },
        {
            inventoryEndingOnHand: 4000000,
            daysOut: 12
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 13
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 14
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 15
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 16
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 17
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 18
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 19
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 20
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 21
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 22
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 23
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 24
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 25
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 26
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 27
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 28
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 29
        },
        {
            inventoryEndingOnHand: 5000000,
            daysOut: 30
        }
    ];

    compareProjectionsToExpected(projections, expectedProjections);
}

function checkInitialTransferPlanProjections(projections: Projection[]) {
    logger.info("Checking projections results");

    const expectedProjections = [
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 1
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 2
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 3
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 4
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 5
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 6
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 7
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 8
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 9
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 10
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 11
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 12
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 13
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 14
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 15
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 16
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 17
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 18
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 19
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 20
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 21
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 22
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 23
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 24
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 25
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 26
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 27
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 28
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 29
        },
        {
            inventoryEndingOnHand: -1000000,
            daysOut: 30
        }
    ];

    compareProjectionsToExpected(projections, expectedProjections);
}

function checkProjectionsPostDelete(projections: Projection[]) {
    logger.info("Checking projections results");

    const expectedProjections = [
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 1
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 2
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 3
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 4
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 5
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 6
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 7
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 8
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 9
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 10
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 11
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 12
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 13
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 14
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 15
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 16
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 17
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 18
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 19
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 20
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 21
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 22
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 23
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 24
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 25
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 26
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 27
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 28
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 29
        },
        {
            inventoryEndingOnHand: 1000000,
            daysOut: 30
        }
    ];

    compareProjectionsToExpected(projections, expectedProjections);
}

function compareProjectionsToExpected(projections: Projection[], expectedProjections: TestProjection[]) {
    expect(projections.length).toBe(expectedProjections.length); //system is 30 by default right now
    // not comparing entire body due to clarity of error and because of the dateGenerated field
    expect(projections[0].inventoryEndingOnHand).toBe(expectedProjections[0].inventoryEndingOnHand);
    expect(projections[1].inventoryEndingOnHand).toBe(expectedProjections[1].inventoryEndingOnHand);
    expect(projections[2].inventoryEndingOnHand).toBe(expectedProjections[2].inventoryEndingOnHand);
    expect(projections[3].inventoryEndingOnHand).toBe(expectedProjections[3].inventoryEndingOnHand);
    expect(projections[4].inventoryEndingOnHand).toBe(expectedProjections[4].inventoryEndingOnHand);
    expect(projections[5].inventoryEndingOnHand).toBe(expectedProjections[5].inventoryEndingOnHand);
    expect(projections[6].inventoryEndingOnHand).toBe(expectedProjections[6].inventoryEndingOnHand);
    expect(projections[7].inventoryEndingOnHand).toBe(expectedProjections[7].inventoryEndingOnHand);
    expect(projections[8].inventoryEndingOnHand).toBe(expectedProjections[8].inventoryEndingOnHand);
    expect(projections[9].inventoryEndingOnHand).toBe(expectedProjections[9].inventoryEndingOnHand);
    expect(projections[10].inventoryEndingOnHand).toBe(expectedProjections[10].inventoryEndingOnHand);
    expect(projections[11].inventoryEndingOnHand).toBe(expectedProjections[11].inventoryEndingOnHand);
    expect(projections[12].inventoryEndingOnHand).toBe(expectedProjections[12].inventoryEndingOnHand);
    expect(projections[13].inventoryEndingOnHand).toBe(expectedProjections[13].inventoryEndingOnHand);
    expect(projections[14].inventoryEndingOnHand).toBe(expectedProjections[14].inventoryEndingOnHand);
    expect(projections[15].inventoryEndingOnHand).toBe(expectedProjections[15].inventoryEndingOnHand);
    expect(projections[16].inventoryEndingOnHand).toBe(expectedProjections[16].inventoryEndingOnHand);
    expect(projections[17].inventoryEndingOnHand).toBe(expectedProjections[17].inventoryEndingOnHand);
    expect(projections[18].inventoryEndingOnHand).toBe(expectedProjections[18].inventoryEndingOnHand);
    expect(projections[19].inventoryEndingOnHand).toBe(expectedProjections[19].inventoryEndingOnHand);
    expect(projections[21].inventoryEndingOnHand).toBe(expectedProjections[21].inventoryEndingOnHand);
    expect(projections[22].inventoryEndingOnHand).toBe(expectedProjections[22].inventoryEndingOnHand);
    expect(projections[23].inventoryEndingOnHand).toBe(expectedProjections[23].inventoryEndingOnHand);
    expect(projections[24].inventoryEndingOnHand).toBe(expectedProjections[24].inventoryEndingOnHand);
    expect(projections[25].inventoryEndingOnHand).toBe(expectedProjections[25].inventoryEndingOnHand);
    expect(projections[26].inventoryEndingOnHand).toBe(expectedProjections[26].inventoryEndingOnHand);
    expect(projections[27].inventoryEndingOnHand).toBe(expectedProjections[27].inventoryEndingOnHand);
    expect(projections[28].inventoryEndingOnHand).toBe(expectedProjections[28].inventoryEndingOnHand);
    expect(projections[29].inventoryEndingOnHand).toBe(expectedProjections[29].inventoryEndingOnHand);
}

function checkInitialExceptions(exceptions: Item[]) {
    expect(exceptions.length).toBe(1);
}

function checkExceptionsExpectNone(exceptions: Item[]) {
    expect(exceptions.length).toBe(0);
}

async function checkResults(
    locationId: string,
    itemId: string,
    apiProxy: ApiProxy,
    checkProjections: (projections: Projection[]) => void,
    checkExceptions: (exceptions: Item[]) => void,
    maxRetries = 10
) {
    let condition = false;
    let numRetries = 0;
    let passed = false;
    while (condition === false && passed === false) {
        const projectionsResponse = await apiProxy.getProjections(itemId);
        const exceptionsResponse = await apiProxy.getExceptionsByLocation(locationId);

        try {
            checkProjections(projectionsResponse["projections"]);
            checkExceptions(exceptionsResponse["results"]);
            passed = true;
        } catch (e) {
            // keeping console log, because it shows jest error better
            logger.info(`Failed projections check with ${e}`);
            logger.info(`Sleeping for ${sleepTime} milliseconds`);
            await delay(sleepTime);
            numRetries++;
            if (numRetries >= maxRetries) {
                condition = true;
            }
        }
    }

    expect(passed).toBeTruthy();
}

describe("calculation deletes", () => {
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

    afterAll(async () => {
        logger.info("Cleaning up calculation test data");
        for (const locationId of locationIds) {
            await apiProxy.deleteLocation(locationId);
        }

        for (const itemId of itemIds) {
            await apiProxy.deleteItem(itemId);
        }
    });

    test("Calculation inventory plan | success | projections return to normal after deleting", async () => {
        const testingLocation = getLocation(LocationType.MANUFACTURER);
        const testingLocationResponse = await apiProxy.postLocation(testingLocation);
        locationIds.push(testingLocationResponse.id);

        const item = getItem(sku, startingItemAmount);
        const itemResponse = await apiProxy.postItem(testingLocationResponse.id, item);
        itemIds.push(itemResponse.id);

        await createInventoryPlan(apiProxy, 12, itemResponse.id);

        // check that inventory plan projections are saved
        await checkResults(
            testingLocationResponse.id,
            itemResponse.id,
            apiProxy,
            checkInitialInventoryPlanProjections,
            checkExceptionsExpectNone
        );

        // delete inventory plan
        logger.info("Deleting inventory plan");
        for (const inventoryPlanId of inventoryPlanIds) {
            await apiProxy.deleteInventoryPlan(inventoryPlanId);
        }

        await checkResults(
            testingLocationResponse.id,
            itemResponse.id,
            apiProxy,
            checkProjectionsPostDelete,
            checkExceptionsExpectNone
        );
    });

    test("Calculation transfer plan | success | projections return to normal after deleting", async () => {
        const testingLocation = getLocation(LocationType.DISTRIBUTOR);
        const testingLocationResponse = await apiProxy.postLocation(testingLocation);
        locationIds.push(testingLocationResponse.id);

        const takingLocation = getLocation(LocationType.DISTRIBUTOR);
        const takingLocationResponse = await apiProxy.postLocation(takingLocation);
        locationIds.push(takingLocationResponse.id);

        await apiProxy.postTransfer(testingLocationResponse.id, takingLocationResponse.id, leadTime);

        const item = getItem(sku, startingItemAmount);
        const itemResponse = await apiProxy.postItem(testingLocationResponse.id, item);
        itemIds.push(itemResponse.id);

        const takingItem = getItem(sku, startingItemAmount);
        const takingItemResponse = await apiProxy.postItem(takingLocationResponse.id, takingItem);
        itemIds.push(takingItemResponse.id);

        await createTransferPlan(apiProxy, 2000000, testingLocationResponse.id, takingLocationResponse.id);

        await checkResults(
            testingLocationResponse.id,
            itemResponse.id,
            apiProxy,
            checkInitialTransferPlanProjections,
            checkInitialExceptions
        );

        // delete transfer plan
        logger.info("Deleting transfer plan");
        for (const transferPlanId of transferPlanIds) {
            await apiProxy.deleteTransferPlan(transferPlanId);
        }

        await checkResults(
            testingLocationResponse.id,
            itemResponse.id,
            apiProxy,
            checkProjectionsPostDelete,
            checkExceptionsExpectNone
        );
    });
});
