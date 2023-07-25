// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

module.exports = {
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    testMatch: ["**/*.test.tsx", "**/*.test.ts"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
    resolver: "<rootDir>/src/resolver.js",
    moduleNameMapper: {
        "\\.(css|scss)$": "identity-obj-proxy"
    },
    preset: "@cloudscape-design/jest-preset",
    testEnvironment: "jsdom",
    setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
    collectCoverageFrom: [
        "src/**/*.ts",
        "src/**/*.tsx",
        "!**/test/*.ts",
        "!**/test/*.tsx",
        "!src/index.tsx",
        "!src/App.tsx",
        "!src/reportWebVitals.ts",
        "!src/layout.tsx",
        "!src/routes/tabs.tsx",
        "!src/components/crudTable.tsx",
        "!src/components/makeData.tsx"
    ]
};
