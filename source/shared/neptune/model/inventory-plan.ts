// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InventoryPlanType, isEnum } from "./constants";
import { Vertex } from "./vertex";

export interface InventoryPlan extends Vertex {
    startDate?: Date;
    endDate?: Date;
    turnoverHour?: number; // hour from 0 to 23
    planType?: InventoryPlanType;
    dailyRate?: number;
    itemId?: string; // needed to handle calculating projections on delete
}

/**
 *
 * @param {InventoryPlan} obj object to check
 * @param {boolean} complete if true, checks that all InventoryPlan keys are present (for a post request), otherwise checks that all keys on obj are valid and that id is present (for a put/delete request)
 * @param {boolean} hasId if true, returns false if obj.id does not match hasId
 * @returns {boolean} true if obj is an InventoryPlan
 */
export function isInventoryPlan(obj: InventoryPlan, complete: boolean, hasId: boolean): boolean {
    if (!!obj.id != hasId) return false;
    const keyCount =
        (typeof obj.id === "string" ? 1 : 0) +
        (typeof obj.startDate === "object" || typeof obj.startDate === "string" ? 1 : 0) +
        (typeof obj.endDate === "object" || typeof obj.endDate === "string" ? 1 : 0) +
        ((typeof obj.turnoverHour === "number" && obj.turnoverHour >= 0 && obj.turnoverHour <= 23) ? 1 : 0) +
        (isEnum(InventoryPlanType, obj.planType) ? 1 : 0) +
        ((typeof obj.dailyRate === "number" && obj.dailyRate > 0) ? 1 : 0);
    if (complete) {
        return keyCount === 5 + (hasId ? 1 : 0);
    }
    return keyCount === Object.keys(obj).length;
}
