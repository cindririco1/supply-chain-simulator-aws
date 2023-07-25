// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import * as moment from "moment";
import { Config } from "../../util/config";
import { CfProxy } from "../../proxy/cf-proxy";
import { ApiProxy } from "../../proxy/api-proxy";
import { logger } from "../../util/logger";
import { LocationType, VertexLabel } from "shared/neptune/model/constants";
import { customField } from "../../util/constants";
import { CustomField } from "shared/neptune/model/custom-field";
import { Location } from "shared/neptune/model/location";
import { getItem, getLocation } from "../../factory/model-factory";
import { Item } from "shared/neptune/model/item";

jest.setTimeout(300000);

describe("custom-field-apis", () => {
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

    test("Custom Field API | success | create and then delete location custom fields", async () => {
        logger.info(`${moment.utc()}: Creating test location`);
        const testLocation = getLocation(LocationType.MANUFACTURER);
        const manufacturingLocation = await apiProxy.postLocation(testLocation);

        const currentFields = (await apiProxy.getCustomFields(VertexLabel.LOCATION)) as CustomField[];

        logger.info(`${moment.utc()}: Posting Custom Fields with New Field`);
        await apiProxy.postCustomFields(VertexLabel.LOCATION, [customField], []);

        logger.info(`${moment.utc()}: Fetching Existing Custom Fields`);
        const updatedFields = (await apiProxy.getCustomFields(VertexLabel.LOCATION)) as CustomField[];

        logger.info(`${moment.utc()}: Validating if New Field is Added`);
        expect(updatedFields.length).toBe(currentFields.length + 1);
        let found = false;
        updatedFields.forEach(field => {
            if (field.fieldName === customField.fieldName && field.fieldType === customField.fieldType) {
                found = true;
            }
        });
        expect(found).toBeTruthy();

        logger.info(`${moment.utc()}: Validating if Locations are Updated`);
        let retrievedLocation = (await apiProxy.getLocation(manufacturingLocation.id)) as Item;
        let userDefinedFields = JSON.parse(retrievedLocation.userDefinedFields!);
        expect(userDefinedFields[customField.fieldName]).toBe("");

        // test deleting
        await apiProxy.postCustomFields(VertexLabel.LOCATION, [], [customField]);
        logger.info(`${moment.utc()}: Validating if custom fields are gone`);
        retrievedLocation = (await apiProxy.getLocation(manufacturingLocation.id)) as Location;
        userDefinedFields = JSON.parse(retrievedLocation.userDefinedFields!);
        expect(userDefinedFields[customField.fieldName]).toBeUndefined();

        logger.info(`${moment.utc()}: Deleting test location`);
        await apiProxy.deleteLocation(manufacturingLocation.id);
    });

    test("Custom Field API | success | create item custom fields", async () => {
        logger.info(`${moment.utc()}: Creating test location`);
        const testLocation = getLocation(LocationType.MANUFACTURER);
        const manufacturingLocation = await apiProxy.postLocation(testLocation);

        logger.info(`${moment.utc()}: Creating test item`);
        const item = getItem("my-custom-field-test-sku", 100);
        const itemResponse = await apiProxy.postItem(manufacturingLocation.id, item);

        const currentFields = (await apiProxy.getCustomFields(VertexLabel.ITEM)) as CustomField[];

        logger.info(`${moment.utc()}: Posting Custom Fields with New Field`);
        await apiProxy.postCustomFields(VertexLabel.ITEM, [customField], []);

        logger.info(`${moment.utc()}: Fetching Existing Custom Fields`);
        const updatedFields = (await apiProxy.getCustomFields(VertexLabel.ITEM)) as CustomField[];

        logger.info(`${moment.utc()}: Validating if New Field is Added`);
        expect(updatedFields.length).toBe(currentFields.length + 1);
        let found = false;
        updatedFields.forEach(field => {
            if (field.fieldName === customField.fieldName && field.fieldType === customField.fieldType) {
                found = true;
            }
        });
        expect(found).toBeTruthy();

        logger.info(`${moment.utc()}: Validating if Items are Updated`);
        let retrievedItem = (await apiProxy.getItem(itemResponse.id)) as Item;
        let userDefinedFields = JSON.parse(retrievedItem.userDefinedFields!);
        expect(userDefinedFields[customField.fieldName]).toBe("");

        await apiProxy.postCustomFields(VertexLabel.ITEM, [], [customField]);
        logger.info(`${moment.utc()}: Validating if custom fields are gone`);
        retrievedItem = (await apiProxy.getItem(itemResponse.id)) as Item;
        userDefinedFields = JSON.parse(retrievedItem.userDefinedFields!);
        expect(userDefinedFields[customField.fieldName]).toBeUndefined();

        logger.info(`${moment.utc()}: Deleting test location`);
        await apiProxy.deleteLocation(manufacturingLocation.id);

        logger.info(`${moment.utc()}: Deleting test item`);
        await apiProxy.deleteItem(itemResponse.id);
    });
});
