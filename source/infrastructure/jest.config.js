// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/test"],
    testMatch: ["**/*.test.ts"],
    collectCoverageFrom: ["**/*.ts", "!**/test/*.ts"],
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    moduleNameMapper: { "^aws-cdk-lib/.warnings.jsii.js$": "<rootDir>/node_modules/aws-cdk-lib/.warnings.jsii.js" }
};
