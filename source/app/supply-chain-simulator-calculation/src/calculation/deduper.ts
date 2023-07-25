// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataChange } from "../types/queueMessageType";

/**
 * De-duplicates any duplicate messages on the queue according to db id and operation against
 * that db item
 * @param dataChanges messages about what data changed from the queue
 * @returns deduped list of data changes
 */
export function deDupe(dataChanges: DataChange[]): DataChange[] {
    const tracker = new Map();

    for (const dataChange of dataChanges) {
        const deDupeKey = getDeDupeKey(dataChange);
        const trackedChange = tracker.get(deDupeKey);
        if (!trackedChange) {
            tracker.set(deDupeKey, dataChange);
        }
    }

    return Array.from(tracker.values());
}

function getDeDupeKey(dataChange: DataChange) {
    return `${dataChange.id}-${dataChange.op}`;
}

export function deDupeById(dataChanges: DataChange[]): DataChange[] {
    const tracker = new Map();

    for (const dataChange of dataChanges) {
        const trackedChange = tracker.get(dataChange.id);
        if (!trackedChange) {
            tracker.set(dataChange.id, dataChange);
        }
    }

    return Array.from(tracker.values());
}
