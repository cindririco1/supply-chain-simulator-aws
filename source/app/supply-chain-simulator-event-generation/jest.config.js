// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    testMatch: ["**/*.test.ts"],
    collectCoverageFrom: ["**/*.ts", "!**/test/*.ts", "!src/index.ts"],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    }
};
