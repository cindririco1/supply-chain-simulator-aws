// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Vertex } from "./vertex";

export interface Item extends Vertex {
    amount?: number;
    dateEntered?: Date;
    sku?: string;
    userDefinedFields?: string; // A stringified JSON object as Neptune doesn't support
}

/**
 * @param {Item} obj object to check
 * @param {boolean} complete if true, checks that all Item keys are present (for a post request), otherwise checks that all keys on obj are valid and that id is present (for a put/delete request)
 * @param {boolean} hasId if true, returns false if obj.id does not match hasId
 * @returns {boolean} true if obj is an Item
 */
export function isItem(obj: Item, complete: boolean, hasId: boolean): boolean {
    if (!!obj.id != hasId) return false;
    const keyCount =
        (typeof obj.id === "string" ? 1 : 0) +
        (typeof obj.amount === "number" ? 1 : 0) +
        (typeof obj.sku === "string" ? 1 : 0) +
        (typeof obj.userDefinedFields === "string" ? 1 : 0);
    if (complete) {
        return keyCount === 3 + (hasId ? 1 : 0);
    }
    return keyCount === Object.keys(obj).length;
}
