// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import * as moment from "moment";
import { Config } from "../../util/config";
import { CfProxy } from "../../proxy/cf-proxy";
import { ApiProxy } from "../../proxy/api-proxy";
import { logger } from "../../util/logger";
import { Seeder } from "../../util/seeder";
import { InventoryPlanSeederResponse } from "../../util/constants";
import { InventoryPlan } from "shared/neptune/model/inventory-plan"

jest.setTimeout(300000);

const DAILY_RATE = 1000;
const TURNOVER_HOUR = 5;

describe("inventory-plan-apis", () => {
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

    test("Test CRUD operations for inventory plans | Success | Gets, posts, updates, deletes an inventory plan", async () => {
        logger.info(`${moment.utc()}: Fetching Existing Inventory Plans`);
        
        const prevInvenPlans = await apiProxy.getAllInventoryPlan() as InventoryPlan[];

        logger.info(`${moment.utc()}: Create locations, items, and inventory plan between locations`);
        const seeder = new Seeder(apiProxy);
        const seedInventoryPlan: InventoryPlanSeederResponse = await seeder.persistInventoryPlanForPlanExecution();

        const testInventoryPlanLocation = seedInventoryPlan.locationId;
        const testInventoryPlanItemId = seedInventoryPlan.itemId;
        const testInventoryPlanId = seedInventoryPlan.planId;

        const postInvenPlans = await apiProxy.getAllInventoryPlan() as InventoryPlan[];

        logger.info(`${moment.utc()}: Validate new inventory plan is created`);
        const filteredPlans = postInvenPlans.filter((invenPlanAfter) => !prevInvenPlans.some((invenPlanBefore) => invenPlanAfter.id === invenPlanBefore.id));

        expect(filteredPlans.length).toBe(1);
        expect(filteredPlans[0].id).toBe(testInventoryPlanId);

        logger.info(`${moment.utc()}: Validate get command using id`);
        const getResponse = await apiProxy.getInventoryPlan(testInventoryPlanId);
        expect(getResponse.id).toBe(testInventoryPlanId);

        logger.info(`${moment.utc()}: Validate put command`);
        const newInventoryPlan: InventoryPlan = {id: testInventoryPlanId, turnoverHour: TURNOVER_HOUR, dailyRate: DAILY_RATE}
        const putResponse = await apiProxy.putInventoryPlan(testInventoryPlanItemId, newInventoryPlan);
        expect(putResponse.id).toBe(testInventoryPlanId);

        logger.info(`${moment.utc()}: Validate get commands using location, take location, give location`);
        const getByLocationResponse = await apiProxy.getInventoryPlanByLocation(testInventoryPlanLocation);
        expect(getByLocationResponse.length).toBe(1);
        expect(getByLocationResponse[0].inventoryPlan.id).toBe(testInventoryPlanId);

        seeder.cleanUpForInventoryPlanExecution(seedInventoryPlan);
    });
});
