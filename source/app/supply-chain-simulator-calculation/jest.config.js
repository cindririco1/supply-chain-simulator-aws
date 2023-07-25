// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    testEnvironment: "node",
    roots: ["<rootDir>/test", "<rootDir>/src"],
    testMatch: ["**/*.test.ts"],
    testTimeout: 20000,
    collectCoverageFrom: [
        "src/**/*.ts",
        "!**/test/*.ts",
        // local queue is just a local utility class
        "!src/messaging/localQueue.ts",
        // config is straightforward, no testing needed
        "!src/util/config.ts",
        // index should be kept small, contains while true loop
        "!src/index.ts"
    ],
    transformIgnorePatterns: ["node_modules/(?!neptune)"],
    restoreMocks: true,
    clearMocks: true,
    resetMocks: true,
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    }
};
