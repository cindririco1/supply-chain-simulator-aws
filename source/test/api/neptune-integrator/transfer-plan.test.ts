// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import * as moment from "moment";
import { Config } from "../../util/config";
import { CfProxy } from "../../proxy/cf-proxy";
import { ApiProxy } from "../../proxy/api-proxy";
import { logger } from "../../util/logger";
import { Seeder } from "../../util/seeder";
import { TransferPlanSeederResponse } from "../../util/constants";
import { TransferPlan } from "shared/neptune/model/transfer-plan"
import { TransferPlanStatus } from "shared/neptune/model/constants";

jest.setTimeout(300000);

const ITEM_AMOUNT = 1000;

describe("transfer-plan-apis", () => {
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

    test("Test CRUD operations for transfer plans | Success | Gets, posts, updates, deletes transfer plan", async () => {
        const getAllResponseBefore = await apiProxy.getAllTransferPlan() as TransferPlan[];

        logger.info(`${moment.utc()}: Create locations, items, and transfer plan between locations`);
        const seeder = new Seeder(apiProxy);
        const seedTransferPlan: TransferPlanSeederResponse = await seeder.persistTransferPlanForPlanExecution();

        const testTransferPlanFromLocation = seedTransferPlan.fromLocationId;
        const testTransferPlanToLocation = seedTransferPlan.toLocationId;
        const testTransferPlanId = seedTransferPlan.planId;

        const getAllResponseAfter = await apiProxy.getAllTransferPlan() as TransferPlan[];

        logger.info(`${moment.utc()}: Validate new transfer plan is created`);
        const filteredPlans = getAllResponseAfter.filter((transferPlanAfter) => !getAllResponseBefore.some((transferPlanBefore) => transferPlanAfter.id === transferPlanBefore.id));

        expect(filteredPlans.length).toBe(1);
        expect(filteredPlans[0].id).toBe(testTransferPlanId);

        logger.info(`${moment.utc()}: Validate put command`);
        const newTransferPlan: TransferPlan = {id: testTransferPlanId, transferAmount: ITEM_AMOUNT}
        const putResponse = await apiProxy.putTransferPlan(newTransferPlan);
        expect(putResponse.id).toBe(testTransferPlanId);

        logger.info(`${moment.utc()}: Validate get commands using location, take location, give location`);
        const getByLocationResponse = await apiProxy.getTransferPlanByLocation(testTransferPlanFromLocation);
        expect(getByLocationResponse.length).toBe(1);
        expect(getByLocationResponse[0].transferPlan.transferAmount).toBe(ITEM_AMOUNT);
        expect(getByLocationResponse[0].transferPlan.id).toBe(testTransferPlanId);
        expect(getByLocationResponse[0].transferPlan.status).toBe(TransferPlanStatus.NEW);

        const getByGiveLocationResponse = await apiProxy.getTransferPlanByGiveLocation(testTransferPlanToLocation);
        expect(getByGiveLocationResponse.length).toBe(1);
        expect(getByGiveLocationResponse[0].transferPlan.id).toBe(testTransferPlanId);
        expect(getByLocationResponse[0].transferPlan.status).toBe(TransferPlanStatus.NEW);

        const getByTakeLocationResponse = await apiProxy.getTransferPlanByTakeLocation(testTransferPlanFromLocation);
        expect(getByTakeLocationResponse.length).toBe(1);
        expect(getByTakeLocationResponse[0].transferPlan.id).toBe(testTransferPlanId);
        expect(getByLocationResponse[0].transferPlan.status).toBe(TransferPlanStatus.NEW);

        await seeder.cleanUpForTransferPlanExecution(seedTransferPlan);
    });
});
