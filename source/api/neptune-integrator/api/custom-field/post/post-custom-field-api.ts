// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { validateBody } from "api/validation";
import { NeptuneDB } from "neptune/db/neptune-db";
import { VertexLabel } from "neptune/model/constants";
import { areCustomFields, CustomField } from "neptune/model/custom-field";
import { Item } from "neptune/model/item";
import { Location } from "neptune/model/location";
import Logger from "util/logger";
import { PathParser } from "util/pathParser";
import { CustomFieldLabelSuffix } from "../constants";

export class PostCustomFieldApi implements ApiInterface {
    logger: Logger;
    db: NeptuneDB;
    static EXPECTED_PATH_PARTS = 3;

    constructor(db: NeptuneDB) {
        this.logger = new Logger(this.constructor.name);
        this.db = db;
    }

    @validateBody(areCustomFields, true, false, ["customFields"])
    async execute(path: string, body: string | null, _headers: object): Promise<ApiResponse> {
        this.logger.info(`Path: ` + path);
        const label = PathParser.getLastItemInPath(path, PostCustomFieldApi.EXPECTED_PATH_PARTS) as VertexLabel;
        const customFieldLabel = (label + CustomFieldLabelSuffix) as VertexLabel;
        if (!this.isVertexLabelValid(customFieldLabel)) {
            return apiResponses._404(`Vertex label is invalid: ${label}`);
        }
        const parsedVertex = JSON.parse(body as string);

        const newCustomFields = parsedVertex.customFields.new as CustomField[];
        const deleteCustomFields = parsedVertex.customFields.delete as CustomField[];

        // Add the custom field vertices which are added from UI
        try {
            newCustomFields
                .filter((field: CustomField) => field.fieldName !== "")
                .forEach(async (field: CustomField) => await this.db.createVertex(customFieldLabel, field));
        } catch (e) {
            this.logger.error(`Error adding custom fields: ${e}`);
            return apiResponses._500({ message: "Encountered error adding custom fields" });
        }

        // Delete the custom field vertices which are removed from UI
        try {
            deleteCustomFields.forEach(
                async (field: CustomField) => await this.db.deleteCustomField(customFieldLabel, field)
            );
        } catch (e) {
            this.logger.error(`Error removing custom fields: ${e}`);
            return apiResponses._500({ message: "Encountered error removing custom fields" });
        }

        // Update Item / Location vertices by updating userDefinedFields
        return await this.updateFields(label, newCustomFields, deleteCustomFields);
    }

    /**
     * Update Item / Location vertices by updating userDefinedFields.
     *
     * @param label
     * @param addedFields
     * @param deletedFields
     */
    async updateFields(
        label: VertexLabel,
        addedFields: CustomField[],
        deletedFields: CustomField[]
    ): Promise<ApiResponse> {
        let vertices;

        switch (label) {
            case VertexLabel.ITEM:
                vertices = (await this.db.getAll(label)) as Item[];
                break;
            case VertexLabel.LOCATION:
                vertices = (await this.db.getAll(label)) as Location[];
                break;
            default:
                this.logger.error(`Unsupported vertex label: ${label}`);
                return apiResponses._400({ message: "Unsupported Custom Field label" });
        }

        for (const vertex of vertices) {
            const userDefinedFields = vertex.userDefinedFields ? vertex.userDefinedFields : "{}";

            const parsedUserDefinedFields = JSON.parse(userDefinedFields);

            deletedFields.forEach(deletedField => {
                delete parsedUserDefinedFields[deletedField.fieldName];
            });

            addedFields.forEach(addedField => {
                if (Object.hasOwn(parsedUserDefinedFields, addedField.fieldName) === false) {
                    parsedUserDefinedFields[addedField.fieldName] = "";
                }
            });

            vertex.userDefinedFields = JSON.stringify(parsedUserDefinedFields);

            // Overwrite the vertex by updating userDefinedFields property
            try {
                await this.db.updateVertex(label, vertex);
            } catch (e) {
                this.logger.error(`Error updating userDefinedFields: ${e}`);
                return apiResponses._500({ message: "Encountered error updating userDefinedFields" });
            }
        }

        return apiResponses._200({ success: "success" });
    }

    /**
     * Validate if vertex label is valid.
     *
     * @param label
     */
    isVertexLabelValid(label: VertexLabel): boolean {
        return Object.values(VertexLabel).includes(label);
    }
}
