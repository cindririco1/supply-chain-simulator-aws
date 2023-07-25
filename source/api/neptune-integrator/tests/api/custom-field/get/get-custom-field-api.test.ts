// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetCustomFieldApi } from "../../../../api/custom-field/get/get-custom-field-api";
import { CustomField, CustomFieldType } from "neptune/model/custom-field";
import { VertexLabel } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getCustomFieldApi", () => {
    it("should construct", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetCustomFieldApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("should return proper values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const customFieldId = "test_custom_field_id";
        const customField1: CustomField = {
            id: customFieldId,
            fieldName: "Street Name",
            fieldType: CustomFieldType.TEXT
        };
        const customField2: CustomField = {
            id: customFieldId,
            fieldName: "Zip Code",
            fieldType: CustomFieldType.NUMBER
        };
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return [customField1, customField2];
        }) as any);
        const api = new GetCustomFieldApi(db);

        // act
        const result = await api.execute(`GET /custom-field/${VertexLabel.LOCATION}`, null, {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(VertexLabel.LOCATION_CUSTOM_FIELD);
        expect(JSON.parse(result.body)["customFields"][0]).toEqual(JSON.parse(JSON.stringify(customField1)));
        expect(JSON.parse(result.body)["customFields"][1]).toEqual(JSON.parse(JSON.stringify(customField2)));
    });

    it("should throw if path is undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new GetCustomFieldApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("Invalid API path");
    });

    it("should return 404 if fields are undefined", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const mock = (db.getAll = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);
        const api = new GetCustomFieldApi(db);

        // act
        const result = await api.execute(`GET /custom-field/${VertexLabel.LOCATION}`, "", {});

        // assert
        expect(mock).toHaveBeenCalledTimes(1);
        expect(result.statusCode).toEqual(404);
    });
});
