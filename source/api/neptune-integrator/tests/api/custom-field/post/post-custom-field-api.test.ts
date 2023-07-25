// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { PostCustomFieldApi } from "../../../../api/custom-field/post/post-custom-field-api";
import { VertexLabel } from "neptune/model/constants";
import { CustomField, CustomFieldType } from "neptune/model/custom-field";
import { Item } from "neptune/model/item";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("postCustomFieldApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PostCustomFieldApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should call database with proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const id = "tes_id";
        const date = new Date();
        const customField1: CustomField = {
            id: id,
            fieldName: "Street Name",
            fieldType: CustomFieldType.TEXT
        };
        const customField2: CustomField = {
            id: id,
            fieldName: "Zip Code",
            fieldType: CustomFieldType.NUMBER
        };
        const customField3: CustomField = {
            id: id,
            fieldName: "City",
            fieldType: CustomFieldType.TEXT
        };
        const item: Item = {
            id: id,
            amount: 10,
            dateEntered: date,
            sku: "sku",
            userDefinedFields: `{"Street Name": "name","Zip Code": "code"}`
        };

        const mockGetAll = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return [item];
        }) as any);
        const mockCreateVertex = (db.createVertex = jest.fn().mockImplementationOnce(async () => {
            return customField3;
        }) as any);
        const mockDeleteCustomField = (db.deleteCustomField = jest.fn().mockImplementationOnce(async () => {
            return "mockDeleteResponse";
        }) as any);
        const mockUpdateVertex = (db.updateVertex = jest.fn().mockImplementationOnce(async () => {
            return "mockUpdateVertex";
        }) as any);
        const api = new PostCustomFieldApi(db);

        // act
        const result = await api.execute(
            `GET /custom-field/${VertexLabel.LOCATION}`,
            `{
                "customFields": {
                    "new": [
                        {
                            "fieldName": "Street Name",
                            "fieldType": "text"
                        },
                        {
                            "fieldName": "City",
                            "fieldType": "text"
                        }
                    ],
                    "delete": [
                        {
                            "fieldName": "Zip Code",
                            "fieldType": "number"
                        }
                    ]
                }
            }`,
            {}
        );

        // assert
        expect(mockGetAll).toHaveBeenCalledTimes(1);
        expect(mockGetAll.mock.calls).toEqual([[VertexLabel.LOCATION]]);

        expect(mockCreateVertex).toHaveBeenCalledTimes(2);
        expect(mockCreateVertex.mock.calls).toEqual([
            [
                VertexLabel.LOCATION_CUSTOM_FIELD,
                {
                    fieldName: "Street Name",
                    fieldType: CustomFieldType.TEXT
                }
            ],
            [
                VertexLabel.LOCATION_CUSTOM_FIELD,
                {
                    fieldName: "City",
                    fieldType: CustomFieldType.TEXT
                }
            ]
        ]);

        expect(mockDeleteCustomField).toHaveBeenCalledTimes(1);
        expect(mockDeleteCustomField).toHaveBeenCalledWith(VertexLabel.LOCATION_CUSTOM_FIELD, {
            fieldName: "Zip Code",
            fieldType: CustomFieldType.NUMBER
        });

        expect(mockUpdateVertex).toHaveBeenCalledTimes(1);
        expect(mockUpdateVertex).toHaveBeenCalledWith(VertexLabel.LOCATION, {
            id: id,
            amount: 10,
            dateEntered: date,
            sku: "sku",
            userDefinedFields: `{"Street Name":"name","City":""}`
        });
    });

    it("should throw if path is undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new PostCustomFieldApi(db);

        // assert
        await expect(async () => {
            await api.execute(
                "",
                `{
                    "customFields": {
                        "new": [
                            {
                                "fieldName": "Street Name",
                                "fieldType": "text"
                            },
                            {
                                "fieldName": "City",
                                "fieldType": "text"
                            }
                        ],
                        "delete": [
                            {
                                "fieldName": "Zip Code",
                                "fieldType": "number"
                            }
                        ]
                    }
                }`,
                {}
            );
        }).rejects.toThrowError("Invalid API path");
    });

    it("should throw if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostCustomFieldApi(db);

        // act/assert
        await expect(async () => {
            await api.execute(`GET /custom-field/${VertexLabel.LOCATION}`, ``, {});
        }).rejects.toThrowError("Properties could not be extracted from body");
    });

    it("should throw if custom fields are missing arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostCustomFieldApi(db);

        // act/assert
        await expect(async () => {
            await api.execute(
                `GET /custom-field/${VertexLabel.LOCATION}`,
                `{
                    "customFields": {
                        "new": [
                            {
                                "fieldName": "Street Name"
                            }
                        ],
                        "delete": []
                    }
                }`,
                {}
            );
        }).rejects.toThrowError("Unexpected/Missing properties in body");
    });

    it("should throw if body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostCustomFieldApi(db);

        // act/assert
        await expect(async () => {
            await api.execute(`GET /custom-field/${VertexLabel.LOCATION}`, null, {});
        }).rejects.toThrowError("body is null");
    });

    it("should throw 404 if custom fields path is incorrect", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostCustomFieldApi(db);

        // act/assert
        const result = await api.execute(
            `POST /custom-field/${VertexLabel.LOCATION}-something`,
            `{
                "customFields": {
                    "new": [
                        {
                            "fieldName": "Street Name",
                            "fieldType": "text"
                        }
                    ],
                    "delete": []
                }
            }`,
            {}
        );

        expect(result.statusCode).toEqual(404);
        expect(result.body).toEqual("Vertex label is invalid: location-something");
    });
});
