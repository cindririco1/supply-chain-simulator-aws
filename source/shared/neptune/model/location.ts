// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LocationType, isEnum } from "./constants";
import { Vertex } from "./vertex";

export interface Location extends Vertex {
    description: string;
    type: LocationType;
    userDefinedFields?: string;
}

/**
 *
 * @param {Location} obj object to check
 * @param {boolean} complete if true, checks that all Location keys are present (for a post request), otherwise checks that all keys on obj are valid and that id is present (for a put/delete request)
 * @param {boolean} hasId if true, returns false if obj.id does not match hasId
 * @returns {boolean} true if obj is a Location
 */
export function isLocation(obj: Location, complete: boolean, hasId: boolean): boolean {
    if (!!obj.id != hasId) return false;
    const keyCount =
        (typeof obj.id === "string" ? 1 : 0) +
        (typeof obj.description === "string" ? 1 : 0) +
        (isEnum(LocationType, obj.type) ? 1 : 0) +
        (typeof obj.userDefinedFields === "string" ? 1 : 0);
    if (complete) {
        return keyCount === 3 + (hasId ? 1 : 0);
    }
    return keyCount === Object.keys(obj).length;
}
