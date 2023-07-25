// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { logger } from "./logger";
import { delay } from "./constants";
import { expect } from "@jest/globals";

export async function checkResults(validationFunction: (...params: any[]) => void, sleepTime = 30000, maxRetries = 10) {
    let condition = false;
    let numRetries = 0;
    let passed = false;
    while (!condition && !passed) {
        try {
            await validationFunction();
            passed = true;
        } catch (e) {
            // keeping console log, because it shows jest error better
            logger.info(`Sleeping for ${sleepTime} milliseconds`);
            await delay(sleepTime);
            numRetries++;
            if (numRetries >= maxRetries) {
                condition = true;
            }
        }
    }

    expect(passed).toBeTruthy();
}
