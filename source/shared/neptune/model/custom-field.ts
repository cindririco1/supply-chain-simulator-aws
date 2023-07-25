// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Vertex } from "./vertex";
import { isEnum } from "./constants";

export interface CustomField extends Vertex {
    fieldName: string;
    fieldType: CustomFieldType;
}

export interface CustomFieldRequest {
    new: CustomField[];
    delete: CustomField[];
}

export enum CustomFieldType {
    TEXT = "text",
    NUMBER = "number",
    DATE = "date"
}

/**
 * @param {CustomField} obj object to check
 * @param {boolean} complete if true, checks that all Item keys are present (for a post request), otherwise checks that all keys on obj are valid and that id is present (for a put/delete request)
 * @param {boolean} hasId if true, returns false if obj.id does not match hasId
 * @returns {boolean} true if obj is an Item
 */
export function isCustomField(obj: CustomField, complete: boolean, hasId: boolean): boolean {
    if (!!obj.id != hasId) return false;
    const keyCount =
        (typeof obj.id === "string" ? 1 : 0) +
        (typeof obj.fieldName === "string" ? 1 : 0) +
        (isEnum(CustomFieldType, obj.fieldType) ? 1 : 0);
    if (complete) {
        return keyCount === 2 + (hasId ? 1 : 0);
    }
    return keyCount === Object.keys(obj).length;
}

/**
 * @param an array of {CustomField} obj object to check
 * @param {boolean} complete if true, checks that all Item keys are present (for a post request), otherwise checks that all keys on obj are valid and that id is present (for a put/delete request)
 * @param {boolean} hasId if true, returns false if obj.id does not match hasId
 * @returns {boolean} true if obj is an Item
 */
export function areCustomFields(obj: CustomFieldRequest, complete: boolean, hasId: boolean) {
    for (const field of obj.new) {
        if (!isCustomField(field, complete, hasId)) {
            return false;
        }
    }
    for (const field of obj.delete) {
        if (!isCustomField(field, complete, hasId)) {
            return false;
        }
    }

    return true;
}
