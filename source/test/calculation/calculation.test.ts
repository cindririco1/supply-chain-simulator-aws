// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeAll, describe, expect, jest, test } from "@jest/globals";
import { InventoryPlanType, LocationType } from "shared/neptune/model/constants";
import { InventoryPlan } from "shared/neptune/model/inventory-plan";
import { Item } from "shared/neptune/model/item";
import { Projection } from "shared/neptune/model/projection";
import { TransferPlan } from "shared/neptune/model/transfer-plan";
import { getItem, getLocation } from "../factory/model-factory";
import { ApiProxy } from "../proxy/api-proxy";
import { CfProxy } from "../proxy/cf-proxy";
import { Config } from "../util/config";
import { delay, leadTime, turnoverHour } from "../util/constants";
import { logger } from "../util/logger";

jest.setTimeout(1000000);

const startingItemAmount = 1000;
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

async function createInventoryPlans(apiProxy: ApiProxy, turnoverHour: number, itemId: string) {
    logger.info("Creating Inventory Plans");
    const startLastDayEndAfter: InventoryPlan = {
        startDate: getDate(30),
        endDate: getDate(35),
        turnoverHour: turnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: 1000000
    };
    let response = await apiProxy.postInventoryPlan(itemId, startLastDayEndAfter);
    inventoryPlanIds.push(response.id);

    const startDayAfterLastEndAfter: InventoryPlan = {
        startDate: getDate(31),
        endDate: getDate(35),
        turnoverHour: turnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: 1000000
    };
    response = await apiProxy.postInventoryPlan(itemId, startDayAfterLastEndAfter);
    inventoryPlanIds.push(response.id);

    const startDuringEndLastDay: InventoryPlan = {
        startDate: getDate(14),
        endDate: getDate(30),
        turnoverHour: turnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: 1000000
    };
    response = await apiProxy.postInventoryPlan(itemId, startDuringEndLastDay);
    inventoryPlanIds.push(response.id);

    const startFirstDayEndDuring: InventoryPlan = {
        startDate: getDate(1),
        endDate: getDate(28),
        turnoverHour: turnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: 1000000
    };
    response = await apiProxy.postInventoryPlan(itemId, startFirstDayEndDuring);
    inventoryPlanIds.push(response.id);

    const startDuringEndingAfter: InventoryPlan = {
        startDate: getDate(24),
        endDate: getDate(44),
        turnoverHour: turnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: 1000000
    };
    response = await apiProxy.postInventoryPlan(itemId, startDuringEndingAfter);
    inventoryPlanIds.push(response.id);

    const startDuringEndingDuring: InventoryPlan = {
        startDate: getDate(10),
        endDate: getDate(20),
        turnoverHour: turnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: 1000000
    };
    response = await apiProxy.postInventoryPlan(itemId, startDuringEndingDuring);
    inventoryPlanIds.push(response.id);

    const startAfterEndAfter: InventoryPlan = {
        startDate: getDate(40),
        endDate: getDate(50),
        turnoverHour: turnoverHour,
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: 1000000
    };
    response = await apiProxy.postInventoryPlan(itemId, startAfterEndAfter);
    inventoryPlanIds.push(response.id);
}

async function createTransferPlans(
    apiProxy: ApiProxy,
    transferAmount: number,
    testingLocationId: string,
    takingLocationId: string,
    givingLocationId: string
) {
    logger.info("Creating Transfer Plans");
    const startLastDayEndAfter: TransferPlan = {
        // taking
        shipDate: getDate(30),
        arrivalDate: getDate(35),
        transferAmount: transferAmount
    };
    let response = await apiProxy.postTransferPlan(givingLocationId, testingLocationId, sku, startLastDayEndAfter);
    transferPlanIds.push(response.id);

    const startDayAfterLastEndAfter: TransferPlan = {
        // giving
        shipDate: getDate(31),
        arrivalDate: getDate(35),
        transferAmount: transferAmount
    };
    response = await apiProxy.postTransferPlan(testingLocationId, takingLocationId, sku, startDayAfterLastEndAfter);
    transferPlanIds.push(response.id);

    const startDuringEndLastDay: TransferPlan = {
        // taking
        shipDate: getDate(14),
        arrivalDate: getDate(30),
        transferAmount: transferAmount
    };
    response = await apiProxy.postTransferPlan(givingLocationId, testingLocationId, sku, startDuringEndLastDay);
    transferPlanIds.push(response.id);

    const startFirstDayEndDuring: TransferPlan = {
        // giving
        shipDate: getDate(1),
        arrivalDate: getDate(28),
        transferAmount: transferAmount
    };
    response = await apiProxy.postTransferPlan(testingLocationId, takingLocationId, sku, startFirstDayEndDuring);
    transferPlanIds.push(response.id);

    const startDuringEndingAfter: TransferPlan = {
        // taking
        shipDate: getDate(24),
        arrivalDate: getDate(44),
        transferAmount: transferAmount
    };
    response = await apiProxy.postTransferPlan(givingLocationId, testingLocationId, sku, startDuringEndingAfter);
    transferPlanIds.push(response.id);

    const startDuringEndingDuring: TransferPlan = {
        // giving
        shipDate: getDate(10),
        arrivalDate: getDate(20),
        transferAmount: transferAmount
    };
    response = await apiProxy.postTransferPlan(testingLocationId, takingLocationId, sku, startDuringEndingDuring);
    transferPlanIds.push(response.id);

    const startAfterEndAfter: TransferPlan = {
        // taking
        shipDate: getDate(40),
        arrivalDate: getDate(50),
        transferAmount: transferAmount
    };
    response = await apiProxy.postTransferPlan(givingLocationId, testingLocationId, sku, startAfterEndAfter);
    transferPlanIds.push(response.id);

    const exceptionCausing: TransferPlan = {
        // giving
        shipDate: getDate(22),
        arrivalDate: getDate(50),
        transferAmount: 86501000
    };
    response = await apiProxy.postTransferPlan(testingLocationId, takingLocationId, sku, exceptionCausing);
    transferPlanIds.push(response.id);
}

function checkProjections(projections: Projection[]) {
    logger.info("Checking projections results");

    expect(projections.length).toBe(30); //system is 30 by default right now

    expect(projections[0].inventoryBeginningOnHand).toBe(startingItemAmount);
    expect(projections[0].inventoryEndingOnHand).toBe(startingItemAmount);
    expect(projections[0].demandPlanned).toBe(1000000);
    expect(projections[0].supplyInTransit).toBe(0);
    expect(projections[0].supplyPlanned).toBe(0);

    expect(projections[1].inventoryBeginningOnHand).toBe(startingItemAmount);
    expect(projections[1].inventoryEndingOnHand).toBe(1001000);
    expect(projections[1].demandPlanned).toBe(0);
    expect(projections[1].supplyInTransit).toBe(0);
    expect(projections[1].supplyPlanned).toBe(0);

    expect(projections[2].inventoryBeginningOnHand).toBe(1001000);
    expect(projections[2].inventoryEndingOnHand).toBe(2001000);
    expect(projections[2].demandPlanned).toBe(0);
    expect(projections[2].supplyInTransit).toBe(0);
    expect(projections[2].supplyPlanned).toBe(0);

    expect(projections[3].inventoryBeginningOnHand).toBe(2001000);
    expect(projections[3].inventoryEndingOnHand).toBe(3001000);
    expect(projections[3].demandPlanned).toBe(0);
    expect(projections[3].supplyInTransit).toBe(0);
    expect(projections[3].supplyPlanned).toBe(0);

    expect(projections[4].inventoryBeginningOnHand).toBe(3001000);
    expect(projections[4].inventoryEndingOnHand).toBe(4001000);
    expect(projections[4].demandPlanned).toBe(0);
    expect(projections[4].supplyInTransit).toBe(0);
    expect(projections[4].supplyPlanned).toBe(0);

    expect(projections[5].inventoryBeginningOnHand).toBe(4001000);
    expect(projections[5].inventoryEndingOnHand).toBe(5001000);
    expect(projections[5].demandPlanned).toBe(0);
    expect(projections[5].supplyInTransit).toBe(0);
    expect(projections[5].supplyPlanned).toBe(0);

    expect(projections[6].inventoryBeginningOnHand).toBe(5001000);
    expect(projections[6].inventoryEndingOnHand).toBe(6001000);
    expect(projections[6].demandPlanned).toBe(0);
    expect(projections[6].supplyInTransit).toBe(0);
    expect(projections[6].supplyPlanned).toBe(0);

    expect(projections[7].inventoryBeginningOnHand).toBe(6001000);
    expect(projections[7].inventoryEndingOnHand).toBe(7001000);
    expect(projections[7].demandPlanned).toBe(0);
    expect(projections[7].supplyInTransit).toBe(0);
    expect(projections[7].supplyPlanned).toBe(0);

    expect(projections[8].inventoryBeginningOnHand).toBe(7001000);
    expect(projections[8].inventoryEndingOnHand).toBe(8001000);
    expect(projections[8].demandPlanned).toBe(0);
    expect(projections[8].supplyInTransit).toBe(0);
    expect(projections[8].supplyPlanned).toBe(0);

    expect(projections[9].inventoryBeginningOnHand).toBe(8001000);
    expect(projections[9].inventoryEndingOnHand).toBe(9001000);
    expect(projections[9].demandPlanned).toBe(1000000);
    expect(projections[9].supplyInTransit).toBe(0);
    expect(projections[9].supplyPlanned).toBe(0);

    expect(projections[10].inventoryBeginningOnHand).toBe(9001000);
    expect(projections[10].inventoryEndingOnHand).toBe(11001000);
    expect(projections[10].demandPlanned).toBe(0);
    expect(projections[10].supplyInTransit).toBe(0);
    expect(projections[10].supplyPlanned).toBe(0);

    expect(projections[11].inventoryBeginningOnHand).toBe(11001000);
    expect(projections[11].inventoryEndingOnHand).toBe(13001000);
    expect(projections[11].demandPlanned).toBe(0);
    expect(projections[11].supplyInTransit).toBe(0);
    expect(projections[11].supplyPlanned).toBe(0);

    expect(projections[12].inventoryBeginningOnHand).toBe(13001000);
    expect(projections[12].inventoryEndingOnHand).toBe(15001000);
    expect(projections[12].demandPlanned).toBe(0);
    expect(projections[12].supplyInTransit).toBe(0);
    expect(projections[12].supplyPlanned).toBe(0);

    expect(projections[13].inventoryBeginningOnHand).toBe(15001000);
    expect(projections[13].inventoryEndingOnHand).toBe(18001000);
    expect(projections[13].demandPlanned).toBe(0);
    expect(projections[13].supplyInTransit).toBe(1000000);
    expect(projections[13].supplyPlanned).toBe(0);

    expect(projections[14].inventoryBeginningOnHand).toBe(18001000);
    expect(projections[14].inventoryEndingOnHand).toBe(21001000);
    expect(projections[14].demandPlanned).toBe(0);
    expect(projections[14].supplyInTransit).toBe(1000000);
    expect(projections[14].supplyPlanned).toBe(0);

    expect(projections[15].inventoryBeginningOnHand).toBe(21001000);
    expect(projections[15].inventoryEndingOnHand).toBe(24001000);
    expect(projections[15].demandPlanned).toBe(0);
    expect(projections[15].supplyInTransit).toBe(1000000);
    expect(projections[15].supplyPlanned).toBe(0);

    expect(projections[16].inventoryBeginningOnHand).toBe(24001000);
    expect(projections[16].inventoryEndingOnHand).toBe(27001000);
    expect(projections[16].demandPlanned).toBe(0);
    expect(projections[16].supplyInTransit).toBe(1000000);
    expect(projections[16].supplyPlanned).toBe(0);

    expect(projections[17].inventoryBeginningOnHand).toBe(27001000);
    expect(projections[17].inventoryEndingOnHand).toBe(30001000);
    expect(projections[17].demandPlanned).toBe(0);
    expect(projections[17].supplyInTransit).toBe(1000000);
    expect(projections[17].supplyPlanned).toBe(0);

    expect(projections[18].inventoryBeginningOnHand).toBe(30001000);
    expect(projections[18].inventoryEndingOnHand).toBe(33001000);
    expect(projections[18].demandPlanned).toBe(0);
    expect(projections[18].supplyInTransit).toBe(1000000);
    expect(projections[18].supplyPlanned).toBe(0);

    expect(projections[19].inventoryBeginningOnHand).toBe(33001000);
    expect(projections[19].inventoryEndingOnHand).toBe(36001000);
    expect(projections[19].demandPlanned).toBe(0);
    expect(projections[19].supplyInTransit).toBe(1000000);
    expect(projections[19].supplyPlanned).toBe(0);

    expect(projections[20].inventoryBeginningOnHand).toBe(36001000);
    expect(projections[20].inventoryEndingOnHand).toBe(38001000);
    expect(projections[20].demandPlanned).toBe(0);
    expect(projections[20].supplyInTransit).toBe(1000000);
    expect(projections[20].supplyPlanned).toBe(0);

    expect(projections[21].inventoryBeginningOnHand).toBe(38001000);
    expect(projections[21].inventoryEndingOnHand).toBe(-46500000);
    expect(projections[21].demandPlanned).toBe(86501000);
    expect(projections[21].supplyInTransit).toBe(1000000);
    expect(projections[21].supplyPlanned).toBe(0);

    expect(projections[22].inventoryBeginningOnHand).toBe(-46500000);
    expect(projections[22].inventoryEndingOnHand).toBe(-44500000);
    expect(projections[22].demandPlanned).toBe(0);
    expect(projections[22].supplyInTransit).toBe(1000000);
    expect(projections[22].supplyPlanned).toBe(0);

    expect(projections[23].inventoryBeginningOnHand).toBe(-44500000);
    expect(projections[23].inventoryEndingOnHand).toBe(-41500000);
    expect(projections[23].demandPlanned).toBe(0);
    expect(projections[23].supplyInTransit).toBe(2000000);
    expect(projections[23].supplyPlanned).toBe(0);

    expect(projections[24].inventoryBeginningOnHand).toBe(-41500000);
    expect(projections[24].inventoryEndingOnHand).toBe(-38500000);
    expect(projections[24].demandPlanned).toBe(0);
    expect(projections[24].supplyInTransit).toBe(2000000);
    expect(projections[24].supplyPlanned).toBe(0);

    expect(projections[25].inventoryBeginningOnHand).toBe(-38500000);
    expect(projections[25].inventoryEndingOnHand).toBe(-35500000);
    expect(projections[25].demandPlanned).toBe(0);
    expect(projections[25].supplyInTransit).toBe(2000000);
    expect(projections[25].supplyPlanned).toBe(0);

    expect(projections[26].inventoryBeginningOnHand).toBe(-35500000);
    expect(projections[26].inventoryEndingOnHand).toBe(-32500000);
    expect(projections[26].demandPlanned).toBe(0);
    expect(projections[26].supplyInTransit).toBe(2000000);
    expect(projections[26].supplyPlanned).toBe(0);

    expect(projections[27].inventoryBeginningOnHand).toBe(-32500000);
    expect(projections[27].inventoryEndingOnHand).toBe(-29500000);
    expect(projections[27].demandPlanned).toBe(0);
    expect(projections[27].supplyInTransit).toBe(2000000);
    expect(projections[27].supplyPlanned).toBe(0);

    expect(projections[28].inventoryBeginningOnHand).toBe(-29500000);
    expect(projections[28].inventoryEndingOnHand).toBe(-27500000);
    expect(projections[28].demandPlanned).toBe(0);
    expect(projections[28].supplyInTransit).toBe(2000000);
    expect(projections[28].supplyPlanned).toBe(0);

    expect(projections[29].inventoryBeginningOnHand).toBe(-27500000);
    expect(projections[29].inventoryEndingOnHand).toBe(-23500000);
    expect(projections[29].demandPlanned).toBe(0);
    expect(projections[29].supplyInTransit).toBe(2000000);
    expect(projections[29].supplyPlanned).toBe(1000000);
}

function checkExceptions(exceptions: Item[]) {
    expect(exceptions.length).toBe(1);
}

async function checkResults(locationId: string, itemId: string, apiProxy: ApiProxy, maxRetries = 10) {
    let condition = false;
    let numRetries = 0;
    let passed = false;
    logger.info(`Running checks for item id ${itemId}`);
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

describe("calculation", () => {
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

        for (const inventoryPlanId of inventoryPlanIds) {
            await apiProxy.deleteInventoryPlan(inventoryPlanId);
        }

        for (const transferPlanId of transferPlanIds) {
            await apiProxy.deleteTransferPlan(transferPlanId);
        }
    });

    /**
     * Scenarios for every inventory plan and transfer plan are:
       starting on last day, ending after
       starting on day just after last day, ending after
       starting during, ending on last day
       starting on first day, ending during
       starting during, ending after
       starting during, ending during
       starting after, ending after

       Not including plans starting before because API/Plan Execution bugs out on these and that
       logic is covered by the calculation's exhaustive unit tests
     */
    test("Calculation all | success | many plans across different date scenarios", async () => {
        const testingLocation = getLocation(LocationType.DISTRIBUTOR);
        const testingLocationResponse = await apiProxy.postLocation(testingLocation);
        locationIds.push(testingLocationResponse.id);

        const takingLocation = getLocation(LocationType.DISTRIBUTOR);
        const takingLocationResponse = await apiProxy.postLocation(takingLocation);
        locationIds.push(takingLocationResponse.id);

        const givingLocation = getLocation(LocationType.DISTRIBUTOR);
        const givingLocationResponse = await apiProxy.postLocation(givingLocation);
        locationIds.push(givingLocationResponse.id);

        await apiProxy.postTransfer(givingLocationResponse.id, testingLocationResponse.id, leadTime);
        await apiProxy.postTransfer(testingLocationResponse.id, takingLocationResponse.id, leadTime);

        const item = getItem(sku, startingItemAmount);
        const itemResponse = await apiProxy.postItem(testingLocationResponse.id, item);
        itemIds.push(itemResponse.id);

        const receivingItem = getItem(sku, startingItemAmount);
        const receivingItemResponse = await apiProxy.postItem(takingLocationResponse.id, receivingItem);
        itemIds.push(receivingItemResponse.id);

        const givingItem = getItem(sku, startingItemAmount);
        const givingItemResponse = await apiProxy.postItem(givingLocationResponse.id, givingItem);
        itemIds.push(givingItemResponse.id);

        await createInventoryPlans(apiProxy, 12, itemResponse.id);

        await createTransferPlans(
            apiProxy,
            1000000,
            testingLocationResponse.id,
            takingLocationResponse.id,
            givingLocationResponse.id
        );

        await checkResults(testingLocationResponse.id, itemResponse.id, apiProxy);
    });

    test("Calculation for SALES plans | success | single inventory plan", async () => {
        const testingLocation = getLocation(LocationType.SELLER);
        const testingLocationResponse = await apiProxy.postLocation(testingLocation);
        locationIds.push(testingLocationResponse.id);

        const item = getItem(sku, startingItemAmount);
        const itemResponse = await apiProxy.postItem(testingLocationResponse.id, item);
        itemIds.push(itemResponse.id);

        const startTomorrowForAWeek: InventoryPlan = {
            startDate: getDate(1),
            endDate: getDate(8),
            turnoverHour: turnoverHour,
            planType: InventoryPlanType.SALES,
            dailyRate: 7
        };

        const response = await apiProxy.postInventoryPlan(itemResponse.id, startTomorrowForAWeek);
        inventoryPlanIds.push(response.id);

        let condition = false,
            numRetries = 0,
            passed = false;
        const maxRetries = 10;
        while (condition === false && passed === false) {
            const projectionResponse = await apiProxy.getProjections(itemResponse.id);

            try {
                logger.info("Checking projection results");
                const projections: Projection[] = projectionResponse["projections"];
                expect(projections.length).toBe(30);

                let beginningOnHand = 1000,
                    endingOnHand = 993;
                for (let index = 0; index < projections.length; index++) {
                    const projection = projections[index];

                    expect(projection.inventoryBeginningOnHand).toBe(beginningOnHand);
                    expect(projection.inventoryEndingOnHand).toBe(endingOnHand);
                    expect(projection.demandPlanned).toBe(0);
                    expect(projection.supplyInTransit).toBe(0);
                    expect(projection.supplyPlanned).toBe(0);

                    //  Manipulate beginning and ending on hand to account for inv plan days
                    if (index >= 0 && index <= 7) {
                        beginningOnHand -= 7;
                    }
                    //  EndingOnHand will be ahead of Beginning by one day / iteration
                    if (index >= 0 && index < 7) {
                        endingOnHand -= 7;
                    }
                }

                passed = true;
            } catch (e) {
                console.error(`Failed projections check with ${e}`);
                logger.info(`Sleeping for ${sleepTime} milliseconds`);
                await delay(sleepTime);
                numRetries++;
                if (numRetries > maxRetries) {
                    condition = true;
                }
            }
        }

        expect(passed).toBeTruthy();
    });
});
