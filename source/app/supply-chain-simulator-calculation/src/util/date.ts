// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Returns the difference in days between two dates
 * @param startDate Starting date
 * @param endDate Ending date
 * @returns difference in days between the two dates
 */
export function diffDate(startDate: Date, endDate: Date): number {
    startDate = new Date(startDate); // to handle cases where date was parsed and thus missing built-in functions
    endDate = new Date(endDate); // to handle cases where date was parsed and thus missing built-in functions

    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    // Discard the time and time-zone information for when dates span Daylight savings time change
    const utc1 = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const utc2 = Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}
