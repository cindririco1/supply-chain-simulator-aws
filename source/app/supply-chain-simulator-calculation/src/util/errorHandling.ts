// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

/**
 * Gets message from error
 * @param error Error being thrown
 * @returns
 */
export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error);
}

type PromiseSettleResult = {
    status: string;
};

/**
 * Checks the status of a promise, currently used in future date data access
 * @param results The results of a promise that ran
 * @param errorMsg the error message to throw if results failed
 */
export function checkPromisesResult(results: PromiseSettleResult[], errorMsg: string) {
    for (const result of results) {
        if (result.status == "rejected") {
            throw new Error(errorMsg);
        }
    }
}
