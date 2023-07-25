// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { API } from "aws-amplify";
import * as shared from "../../../src/components/shared";
import { test, expect, describe, afterEach, jest, beforeEach } from "@jest/globals";
import { InvalidItem } from "neptune/model/invalidItem";
import { CustomFieldType } from "neptune/model/custom-field";
import { AllowedTypes, CustomColumnDef } from "../../../src/components/customize-field-modal";
import { InventoryPlanType, LocationType } from "neptune/model/constants";
import { SetStateAction } from "react";

jest.mock("../../../src/utils/apiHelper", () => {
    return {
        generateToken: jest.fn(() => {
            return "Test Token";
        })
    };
});
jest.mock("aws-amplify");

const api = API;

describe("Testing shared.ts file", () => {
    /*
     * This is all the staged data
     */

    const mockedLocationIds = ["1", "2", "3"];

    const mockedException1: InvalidItem[] = [];
    const mockedException2: InvalidItem[] = [{ id: "invalid2", sku: "52625" }];
    const mockedException3: InvalidItem[] = [
        { id: "invalid1", sku: "1234" },
        { id: "invalid3", sku: "4894" }
    ];

    const mockMappedExceptions: { id: string; data: InvalidItem[] }[] = [
        { id: "1", data: mockedException1 },
        { id: "2", data: mockedException2 },
        {
            id: "3",
            data: mockedException3
        }
    ];

    const rowContent = {
        downstream: "down",
        upStream: "up",
        sku: "sku",
        description: "description",
        amount: "1234",
        startDate: Date.now().toString(),
        endDate: Date.now().toString(),
        turnoverHour: "1",
        planType: InventoryPlanType.MANUFACTURING,
        dailyRate: "1",
        location: "loc",
        type: LocationType.MANUFACTURER,
        fromLocation: "down",
        toLocation: "up",
        shipDate: Date.now().toString(),
        arrivalDate: Date.now.toString(),
        transferAmount: "1"
    };

    const mapLocationId = new Map<string, string>([
        ["down", "down"],
        ["up", "up"]
    ]);
    const errorMessage = {
        response: {
            data: {
                message: "error"
            }
        }
    };

    const locations = {
        locations: [
            {
                id: "94c34a4f-f8b7-626c-e7d5-007fa84a718f",
                label: "location",
                description: "Kindle Manufacturer 11",
                type: "manufacturer",
                userDefinedFields: "{}"
            },
            {
                id: "ccc34a65-9a2b-849f-a7f0-df4f446f5884",
                label: "location",
                description: "kindle distributor 1",
                type: "distributor",
                userDefinedFields: "{}"
            }
        ]
    };

    const transfers = {
        transfers: [
            {
                from: {
                    id: "94c34a4f-f8b7-626c-e7d5-007fa84a718f",
                    label: "location"
                },
                edge: {
                    id: "dcc34a66-85e4-9ab2-ae47-3b62815b04b8",
                    label: "transfers",
                    IN: {
                        id: "ccc34a65-9a2b-849f-a7f0-df4f446f5884",
                        label: "location"
                    },
                    OUT: {
                        id: "94c34a4f-f8b7-626c-e7d5-007fa84a718f",
                        label: "location"
                    }
                },
                to: {
                    id: "ccc34a65-9a2b-849f-a7f0-df4f446f5884",
                    label: "location"
                }
            }
        ]
    };

    /*
     * This is where the tests start
     */

    beforeEach(() => {
        jest.resetAllMocks();
    });
    test("getItemId | success | return item id", async () => {
        //Arrange
        jest.spyOn(API, "get").mockImplementationOnce(() =>
            Promise.resolve({
                items: [
                    { id: "1", sku: "1234" },
                    { id: "2", sku: "0987" }
                ]
            })
        );

        //Execute
        const result = await shared.getItemId("1234", "1");

        // Test
        expect(result).toBeDefined();
    });

    test("getCustomColumns | success | return custom columns", async () => {
        //Arrange
        jest.spyOn(API, "get").mockImplementationOnce(() =>
            Promise.resolve({
                customFields: [
                    { id: "1", fieldName: "Test field", fieldType: CustomFieldType.TEXT },
                    { id: "2", fieldName: "Test Number", fieldType: CustomFieldType.NUMBER }
                ]
            })
        );

        // Execute
        const result = await shared.getCustomColumns("location", () => {});

        expect(result.length).toEqual(2);
    });

    test("postCustomColumns | success | api post called once", async () => {
        //Arrange
        const postVertexMock = (api.post = jest.fn(() => Promise.resolve({})));

        const customColumnDefs: CustomColumnDef[] = [{ fieldName: "field", fieldType: AllowedTypes.TEXT }];
        const deleteColumnDefs: CustomColumnDef[] = [{ fieldName: "other-field", fieldType: AllowedTypes.TEXT }];
        // Execute
        await shared.postCustomColumns("location", customColumnDefs, deleteColumnDefs);

        // Test
        expect(postVertexMock).toBeCalledTimes(1);
    });

    test("deleteTableItems | success | delete downstream Table items", async () => {
        //Arrange
        const delVertexMock = (api.del = jest.fn(() => Promise.resolve({})));

        const rowContent = {
            downstream: {
                id: "down"
            }
        };
        const mapLocationId = new Map<string, string>([
            ["down", "down"],
            ["up", "up"]
        ]);

        // Execute
        await shared.deleteTableItems(rowContent, "downstream", "loc", mapLocationId);

        // Test
        expect(delVertexMock).toBeCalledTimes(1);
    });

    test("deleteTableItems | success | delete upstream Table items", async () => {
        //Arrange
        const delVertexMock = (api.del = jest.fn(() => Promise.resolve({})));

        const rowContent = {
            downstream: {
                id: "down"
            }
        };
        const mapLocationId = new Map<string, string>([
            ["down", "down"],
            ["up", "up"]
        ]);

        // Execute
        await shared.deleteTableItems(rowContent, "upstream", "loc", mapLocationId);

        // Test
        expect(delVertexMock).toBeCalledTimes(1);
    });

    test("deleteTableItems | failure | throws error", async () => {
        //Arrange
        const delVertexMock = (api.del = jest.fn(() => Promise.reject({})));

        const rowContent = {
            downstream: {
                id: "down"
            }
        };
        const mapLocationId = new Map<string, string>([
            ["down", "down"],
            ["up", "up"]
        ]);

        // Execute
        await shared.deleteTableItems(rowContent, "upstream", "loc", mapLocationId);

        // Test
        expect(delVertexMock).toBeCalledTimes(1);
    });

    test("updateTableItems | success | post downstream content successfully ", async () => {
        //Arrange
        const putTableContentMock = (api.put = jest.fn(() => Promise.resolve({})));

        const apiData = {
            id: "apiData"
        };
        // Execute
        const result = await shared.updateTableItems(
            rowContent,
            "downstream",
            [],
            { itemId: "itemId", locationId: "locationId" },
            apiData
        );

        // Test
        expect(result).toBeTruthy();
    });

    test("updateTableItems | failure | update fails and throws error", async () => {
        //Arrange
        const putTableContentMock = (api.put = jest.fn(() => Promise.reject(errorMessage)));

        const apiData = {
            id: "apiData"
        };
        // Execute
        const result = await shared.updateTableItems(
            rowContent,
            "downstream",
            [],
            { itemId: "itemId", locationId: "locationId" },
            apiData,
            () => {}
        );

        // Test
        expect(result).toBeFalsy();
    });

    test("postTableContent| success | post downstream content successfully ", async () => {
        //Arrange
        const postTableContentMock = (api.post = jest.fn(() => Promise.resolve({})));

        // Execute
        const result = await shared.postTableContent(rowContent, "downstream", mapLocationId, [], {
            itemId: "itemId",
            locationId: "locationId"
        });

        // Test
        expect(result).toBeTruthy();
    });

    test("postTableContent | failure| post upstream content unsuccessfully", async () => {
        //Arrange
        const postTableContentMock = (api.post = jest.fn(() => Promise.reject(errorMessage)));
        const mapLocationId = new Map<string, string>([
            ["down", "down"],
            ["up", "up"]
        ]);

        // Execute
        const result = await shared.postTableContent(
            rowContent,
            "upstream",
            mapLocationId,
            [],
            { itemId: "itemId", locationId: "locationId" },
            () => {}
        );

        // Test
        expect(result).toBeFalsy();
    });

    test("populateTableDistributer | success | populateLocationTable successfully", async () => {
        //Arrange

        const data = {
            ...locations,
            ...transfers
        };
        const getGraphData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve(data));

        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: undefined }));
        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: undefined }));

        // Execute
        const result = await shared.populateTableDistributer(
            () => {},
            "location",
            [],
            () => {},
            () => {},
            "testLocation",
            { setNodes: (value: SetStateAction<any[]>) => {}, setEdges: (value: SetStateAction<any[]>) => {} }
        );
        // Test
        expect(getGraphData).toBeCalledTimes(1);
    });

    test("populateTableDistributer | success | populateLocationTable successfully with no transfers", async () => {
        //Arrange

        const data = locations;

        const getGraphData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve(data));

        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: undefined }));
        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: undefined }));

        // Execute
        const result = await shared.populateTableDistributer(
            () => {},
            "location",
            [],
            () => {},
            () => {},
            "testLocation",
            { setNodes: (value: SetStateAction<any[]>) => {}, setEdges: (value: SetStateAction<any[]>) => {} }
        );
        // Test
        expect(getGraphData).toBeCalledTimes(1);
    });

    test("populateTableDistributer | success | populateItemTable successfully", async () => {
        //Arrange
        const data = {
            items: [
                {
                    id: "08c34a66-17a5-2ff5-c468-f25864b79aa5",
                    label: "item",
                    userDefinedFields: "{}",
                    sku: "12345",
                    amount: -6,
                    dateEntered: "2023-03-03T12:00:26.632Z"
                }
            ]
        };

        const getGraphData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve(data));

        // Execute
        const result = await shared.populateTableDistributer(
            () => {},
            "item",
            [],
            () => {},
            () => {},
            "testLocation"
        );

        // Test
        expect(getGraphData).toBeCalledTimes(1);
    });

    test("populateTableDistributer | success | populateUpDownStreamTable for upstream successfully", async () => {
        //Arrange
        const data = {
            locations: [
                {
                    id: "94c34a4f-f8b7-626c-e7d5-007fa84a718f",
                    label: "location",
                    description: "Kindle Manufacturer 11",
                    type: "manufacturer",
                    userDefinedFields: "{}"
                }
            ]
        };

        const getUpstreamData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve(data));
        const getGraphData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ ...locations }));

        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: undefined }));
        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: undefined }));

        // Execute
        const result = await shared.populateTableDistributer(
            () => {},
            "upstream",
            [],
            () => {},
            () => {},
            "testLocation",
            { setNodes: () => {}, setEdges: () => {} }
        );

        // Test
        expect(getUpstreamData).toBeCalledTimes(1);
        expect(getGraphData).toBeCalledTimes(1);
    });

    test("populateTableDistributer | success | populateUpDownStreamTable for downstream successfully", async () => {
        //Arrange
        const data = {
            locations: [
                {
                    id: "94c34a4f-f8b7-626c-e7d5-007fa84a718f",
                    label: "location",
                    description: "Kindle Manufacturer 11",
                    type: "manufacturer",
                    userDefinedFields: "{}"
                }
            ]
        };

        const getUpstreamData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve(data));
        const getGraphData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ ...locations }));

        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: undefined }));
        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: undefined }));

        // Execute
        const result = await shared.populateTableDistributer(
            () => {},
            "downstream",
            [],
            () => {},
            () => {},
            "testLocation",
            { setNodes: () => {}, setEdges: () => {} }
        );

        // Test
        expect(getUpstreamData).toBeCalledTimes(1);
        expect(getGraphData).toBeCalledTimes(1);
    });

    test("populateTableDistributer | success | populateInventoryPlanTable successfully", async () => {
        //Arrange
        const data = {
            inventoryPlans: [
                {
                    location: {
                        id: "94c34a4f-f8b7-626c-e7d5-007fa84a718f",
                        label: "location",
                        description: "Kindle Manufacturer 11",
                        type: "manufacturer",
                        userDefinedFields: "{}"
                    },
                    item: {
                        id: "08c34a66-17a5-2ff5-c468-f25864b79aa5",
                        label: "item",
                        userDefinedFields: "{}",
                        sku: "12345",
                        amount: -6,
                        dateEntered: "2023-03-03T12:00:26.632Z"
                    },
                    inventoryPlan: {
                        id: "dac34a66-688e-36bb-a705-eabb939a678a",
                        label: "inventory-plan",
                        startDate: "2023-02-28",
                        endDate: "2023-03-31",
                        turnoverHour: 12,
                        planType: "manufacturing",
                        dailyRate: 1
                    }
                }
            ]
        };
        const getInventoryPlanData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve(data));

        // Execute
        const result = await shared.populateTableDistributer(
            () => {},
            "inventory-plan",
            [],
            () => {},
            () => {},
            "testLocation",
            { setNodes: () => {}, setEdges: () => {} }
        );

        // Test
        expect(getInventoryPlanData).toBeCalledTimes(1);
    });

    test("populateTableDistributer | success | populateTransferPlanTable successfully", async () => {
        //Arrange
        const data = {
            transferPlans: [
                {
                    fromLocation: {
                        id: "94c34a4f-f8b7-626c-e7d5-007fa84a718f",
                        label: "location",
                        description: "Kindle Manufacturer 11",
                        type: "manufacturer",
                        userDefinedFields: "{}"
                    },
                    toLocation: {
                        id: "ccc34a65-9a2b-849f-a7f0-df4f446f5884",
                        label: "location",
                        description: "kindle distributor 1",
                        type: "distributor",
                        userDefinedFields: "{}"
                    },
                    item: {
                        id: "08c34a66-17a5-2ff5-c468-f25864b79aa5",
                        label: "item",
                        userDefinedFields: "{}",
                        sku: "12345",
                        amount: -6,
                        dateEntered: "2023-03-03T12:00:26.632Z"
                    },
                    transferPlan: {
                        id: "3cc34a66-f73d-10e8-0c8c-e7779a624707",
                        label: "transfer-plan",
                        shipDate: "2023-02-28",
                        arrivalDate: "2023-02-28",
                        transferAmount: 100
                    }
                },
                {
                    fromLocation: {
                        id: "94c34a4f-f8b7-626c-e7d5-007fa84a718f",
                        label: "location",
                        description: "Kindle Manufacturer 11",
                        type: "manufacturer",
                        userDefinedFields: "{}"
                    },
                    toLocation: {
                        id: "ccc34a65-9a2b-849f-a7f0-df4f446f5884",
                        label: "location",
                        description: "kindle distributor 1",
                        type: "distributor",
                        userDefinedFields: "{}"
                    },
                    item: {
                        id: "08c34a66-17a5-2ff5-c468-f25864b79aa5",
                        label: "item",
                        userDefinedFields: "{}",
                        sku: "12345",
                        amount: -6,
                        dateEntered: "2023-03-03T12:00:26.632Z"
                    },
                    transferPlan: {
                        id: "04c34a6a-556d-9399-4c40-79fbac64b680",
                        label: "transfer-plan",
                        shipDate: "2023-03-02",
                        arrivalDate: "2023-03-03",
                        transferAmount: 10
                    }
                }
            ]
        };

        const getTransferPlanData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve(data));

        // Execute
        const result = await shared.populateTableDistributer(
            () => {},
            "transfer-plan",
            [],
            () => {},
            () => {},
            "testLocation",
            { setNodes: () => {}, setEdges: () => {} }
        );

        // Test
        expect(getTransferPlanData).toBeCalledTimes(1);
    });

    test("populateProjectionsTable | success | populateProjectionsTable successfully", async () => {
        //Arrange
        const data = {
            projections: [
                {
                    date: "2023-03-04T00:00:00.000Z",
                    daysOut: 1,
                    futureDateId: "d2c34a3d-3902-80e6-f0e5-3d51626db4b7",
                    inventoryEndingOnHand: -111,
                    supplyInTransit: 0,
                    supplyPlanned: 0,
                    inventoryBeginningOnHand: -112,
                    demandPlanned: 0,
                    dateGenerated: "2023-03-03T12:00:46.270Z"
                },
                {
                    date: "2023-03-05T00:00:00.000Z",
                    daysOut: 2,
                    futureDateId: "7ec34a3d-3902-ca83-8f54-c81f23121df8",
                    inventoryEndingOnHand: -110,
                    supplyInTransit: 0,
                    supplyPlanned: 0,
                    inventoryBeginningOnHand: -111,
                    demandPlanned: 0,
                    dateGenerated: "2023-03-03T12:00:46.270Z"
                },
                {
                    date: "2023-03-06T00:00:00.000Z",
                    daysOut: 3,
                    futureDateId: "c0c34a3d-3903-4803-7d77-79352981f92e",
                    inventoryEndingOnHand: -109,
                    supplyInTransit: 0,
                    supplyPlanned: 0,
                    inventoryBeginningOnHand: -110,
                    demandPlanned: 0,
                    dateGenerated: "2023-03-03T12:00:46.270Z"
                }
            ]
        };
        const getGraphData = jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve(data));

        // Execute
        const result = await shared.populateProjectionsTable(() => {}, [], "testItem");

        // Test
        expect(getGraphData).toBeCalledTimes(1);
    });

    test("getInvalidItemsByLocation | failure | Receives no invalid items", async () => {
        //Arrange
        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: mockedException1 }));

        // Execute
        const results = await shared.getInvalidItemsByLocation("1");

        // Test
        expect(results.length).toBe(0);
    });

    test("Receives 2 invalid items", async () => {
        //Arrange
        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: mockedException3 }));

        // Execute
        const results = await shared.getInvalidItemsByLocation("3");

        //Test
        expect(results.length).toBe(2);
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test("maplocationIdToInvalidItems | Success | mapping location ids to invalid items", async () => {
        //Arrange
        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: mockedException1 }));
        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: mockedException2 }));
        jest.spyOn(API, "get").mockImplementationOnce(() => Promise.resolve({ results: mockedException3 }));
        // Execute
        const results = await shared.maplocationIdToInvalidItems(mockedLocationIds);
        // Test
        expect(results).toStrictEqual(mockMappedExceptions);
    });

    test("createExceptionMessage | success | Return undefined string for no invalid items", () => {
        //Arrange
        // Execute
        const results = shared.createExceptionMessage("1", mockMappedExceptions);
        // Test
        expect(results).toBe(undefined);
    });

    test("createExceptionMessage | success | Return successful string for one invalid items", () => {
        //Arrange
        // Execute
        const results = shared.createExceptionMessage("2", mockMappedExceptions);
        // Test
        expect(results).toBe("Low inventory for SKU 52625");
    });

    test("createExceptionMessage | success | Return successful string for 2 invalid items", () => {
        //Arrange
        // Execute
        const results = shared.createExceptionMessage("3", mockMappedExceptions);
        // Test
        expect(results).toBe("Low inventory for 2 items");
    });
});
