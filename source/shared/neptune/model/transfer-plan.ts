// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Vertex } from "./vertex";
import { TransferPlanStatus } from "./constants";

export interface TransferPlan extends Vertex {
    shipDate?: Date;
    arrivalDate?: Date;
    transferAmount?: number;
    fromItemId?: string; // needed to handle calculating projections on delete
    toItemId?: string; // needed to handle calculating projections on delete
    status?: TransferPlanStatus;
}

/**
 *
 * @param {TransferPlan} obj object to check
 * @param {boolean} complete if true, checks that all TransferPlan keys are present (for a post request), otherwise checks that all keys on obj are valid and that id is present (for a put/delete request)
 * @param {boolean} hasId if true, returns false if obj.id does not match hasId
 * @returns {boolean} true if obj is an TransferPlan
 */
export function isTransferPlan(obj: TransferPlan, complete: boolean, hasId: boolean): boolean {
    if (!!obj.id != hasId) return false;
    const keyCount =
        (typeof obj.id === "string" ? 1 : 0) +
        (typeof obj.shipDate === "object" || typeof obj.shipDate === "string" ? 1 : 0) +
        (typeof obj.arrivalDate === "object" || typeof obj.arrivalDate === "string" ? 1 : 0) +
        ((typeof obj.transferAmount === "number" && obj.transferAmount > 0) ? 1 : 0);
    if (complete) {
        return keyCount === 3 + (hasId ? 1 : 0);
    }
    return keyCount === Object.keys(obj).length;
}
