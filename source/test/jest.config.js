// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>"],
    testMatch: ["**/*.test.ts"],
    collectCoverageFrom: ["**/app/*.ts", "!**/shared/*.ts"],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    reporters: [
        "default",
        [
            "jest-junit",
            {
                outputDirectory: "./",
                outputName: "savant-tests.xml"
            }
        ]
    ]
};
