// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Vertex } from "./vertex";

export interface ItemRecord extends Vertex {
    dateFrom: Date;
    dateTo: Date;
    fromAmount: number;
    toAmount: number;
    planId: string;
}

/**
 * @param {ItemRecord} obj object to check
 * @param {boolean} complete if true, checks that all Item keys are present (for a post request), otherwise checks that all keys on obj are valid and that id is present (for a put/delete request)
 * @param {boolean} hasId if true, returns false if obj.id does not match hasId
 * @returns {boolean} true if obj is an Item
 */
export function isItemRecord(obj: ItemRecord, complete: boolean, hasId: boolean): boolean {
    if (!!obj.id != hasId) return false;
    const keyCount =
      (typeof obj.id === "string" ? 1 : 0) +
      (typeof obj.dateFrom === "object" || typeof obj.dateFrom === "string" ? 1 : 0) +
      (typeof obj.dateTo === "object" || typeof obj.dateTo === "string" ? 1 : 0) +
      (typeof obj.fromAmount === "number" ? 1 : 0) +
      (typeof obj.toAmount === "number" ? 1 : 0) +
      (typeof obj.planId === "string" ? 1 : 0);
    if (complete) {
        return keyCount === 5 + (hasId ? 1 : 0);
    }
    return keyCount === Object.keys(obj).length;
}
