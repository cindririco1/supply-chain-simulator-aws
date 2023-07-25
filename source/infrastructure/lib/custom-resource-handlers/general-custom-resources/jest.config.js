// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>"],
    testMatch: ["**/*.test.ts"],
    collectCoverageFrom: ["./index.js", "./index.ts", "types.js"],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    }
};
