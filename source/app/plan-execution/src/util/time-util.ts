// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/* eslint-disable */
const moment = require("moment");

/**
 * Convert epoch timestamp to Date in format: yyyy-mm-ddThh:mm:ss.
 */

export function convertDate(date: Date): string {
    return moment.utc(date).toISOString().split('.')[0];
}
