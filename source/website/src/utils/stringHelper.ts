// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 *
 * @param path
 */
export function createLabel(path: string): string {
    return path.charAt(0).toUpperCase() + path.slice(1);
}

/**
 *
 * @param value
 */
export function trimAllWhiteSpaces(value: string | undefined) {
    return value ? value.trim().replace(/\s+/g, " ") : "";
}

export function checkStringIsAlphaNumerical(value: string): boolean {
    const regex = new RegExp("^[a-zA-Z0-9'\\-_ ]+$"); // NOSONAR: typescript:S6325 regex is being provided by user
    return regex.test(value);
}

/**
 *
 * @param value
 */
export function pad2ToNumber(value: number) {
    return value.toString().padStart(2, "0");
}
