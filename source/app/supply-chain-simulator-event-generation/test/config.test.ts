// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { afterAll, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { API_METRICS_SOLUTION_ID_ENV_KEY } from "api/apiMetrics";
import { Config } from "../src/util/config";

describe("config", () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
        jest.resetModules(); // Most important - it clears the cache
        process.env = { ...OLD_ENV }; // Make a copy
    });

    afterAll(() => {
        process.env = OLD_ENV; // Restore old environment
    });

    test("will construct ok with env varables", () => {
        // Arrange
        process.env.TIME_INTERVAL = "5000";
        process.env.NEPTUNE_ENDPOINT = "some-endpoint";
        process.env.NEPTUNE_STREAM_PAGE_SIZE = "1000";
        process.env.NEPTUNE_PORT = "8182";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";
        process.env.PLAN_EXECUTION_QUEUE_URL = "some-url";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        // Act
        const config = new Config();

        // Assert
        expect(config).toBeDefined();
    });

    test("will fail to construct when neptune endpoint has http", () => {
        // Arrange
        process.env.TIME_INTERVAL = "5000";
        process.env.NEPTUNE_ENDPOINT = "https://some-endpoint";
        process.env.NEPTUNE_STREAM_PAGE_SIZE = "1000";
        process.env.NEPTUNE_PORT = "8182";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";
        process.env.PLAN_EXECUTION_QUEUE_URL = "some-url";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        let config = null;
        try {
            // Act
            config = new Config();
        } catch (error: any) {
            // Assert
            expect(error.message).toBe("Env var NEPTUNE_ENDPOINT should just be domains and subdomains");
        }
        expect(config).toBeNull();
    });

    test("will fail to construct when time interval not supplied", () => {
        // Arrange
        process.env.NEPTUNE_ENDPOINT = "https://some-endpoint";
        process.env.NEPTUNE_STREAM_PAGE_SIZE = "1000";
        process.env.NEPTUNE_PORT = "8182";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";
        process.env.PLAN_EXECUTION_QUEUE_URL = "some-url";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        let config = null;
        try {
            // Act
            config = new Config();
        } catch (error: any) {
            // Assert
            expect(error.message).toBe("Env var TIME_INTERVAL must be set");
        }
        expect(config).toBeNull();
    });

    test("will fail to construct when neptune endpoint not supplied", () => {
        // Arrange
        process.env.TIME_INTERVAL = "5000";
        process.env.NEPTUNE_STREAM_PAGE_SIZE = "1000";
        process.env.NEPTUNE_PORT = "8182";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";
        process.env.PLAN_EXECUTION_QUEUE_URL = "some-url";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        let config = null;
        try {
            // Act
            config = new Config();
        } catch (error: any) {
            // Assert
            expect(error.message).toBe("Env var NEPTUNE_ENDPOINT must be set");
        }
        expect(config).toBeNull();
    });

    test("will fail to construct when stream page size not supplied", () => {
        // Arrange
        process.env.TIME_INTERVAL = "5000";
        process.env.NEPTUNE_ENDPOINT = "some-endpoint";
        process.env.NEPTUNE_PORT = "8182";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";
        process.env.PLAN_EXECUTION_QUEUE_URL = "some-url";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        let config = null;
        try {
            // Act
            config = new Config();
        } catch (error: any) {
            // Assert
            expect(error.message).toBe("Env var NEPTUNE_STREAM_PAGE_SIZE must be set");
        }
        expect(config).toBeNull();
    });

    test("will fail to construct when neptune port not supplied", () => {
        // Arrange
        process.env.TIME_INTERVAL = "5000";
        process.env.NEPTUNE_ENDPOINT = "some-endpoint";
        process.env.NEPTUNE_STREAM_PAGE_SIZE = "1000";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";
        process.env.PLAN_EXECUTION_QUEUE_URL = "some-url";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        let config = null;
        try {
            // Act
            config = new Config();
        } catch (error: any) {
            // Assert
            expect(error.message).toBe("Env var NEPTUNE_PORT must be set");
        }
        expect(config).toBeNull();
    });

    test("will fail to construct when calculation service queue url not supplied", () => {
        // Arrange
        process.env.TIME_INTERVAL = "5000";
        process.env.NEPTUNE_ENDPOINT = "some-endpoint";
        process.env.NEPTUNE_STREAM_PAGE_SIZE = "1000";
        process.env.NEPTUNE_PORT = "8182";
        process.env.PLAN_EXECUTION_QUEUE_URL = "some-url";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        let config = null;
        try {
            // Act
            config = new Config();
        } catch (error: any) {
            // Assert
            expect(error.message).toBe("Env var CALCULATION_SERVICE_QUEUE_URL must be set");
        }
        expect(config).toBeNull();
    });

    test("will fail to construct when plan execution queue url not supplied", () => {
        // Arrange
        process.env.TIME_INTERVAL = "5000";
        process.env.NEPTUNE_ENDPOINT = "some-endpoint";
        process.env.NEPTUNE_STREAM_PAGE_SIZE = "1000";
        process.env.NEPTUNE_PORT = "8182";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";

        let config = null;
        try {
            // Act
            config = new Config();
        } catch (error: any) {
            // Assert
            expect(error.message).toBe("Env var PLAN_EXECUTION_QUEUE_URL must be set");
        }
        expect(config).toBeNull();
    });

    test("will fail to construct when api metrics key is not supplied", () => {
        // Arrange
        process.env.TIME_INTERVAL = "5000";
        process.env.NEPTUNE_ENDPOINT = "some-endpoint";
        process.env.NEPTUNE_STREAM_PAGE_SIZE = "1000";
        process.env.NEPTUNE_PORT = "8182";
        process.env.PLAN_EXECUTION_QUEUE_URL = "some-url";
        process.env.CALCULATION_SERVICE_QUEUE_URL = "some-url";

        let config = null;
        try {
            // Act
            config = new Config();
        } catch (error: any) {
            // Assert
            expect(error.message).toBe(`Env var ${API_METRICS_SOLUTION_ID_ENV_KEY} must be set`);
        }
        expect(config).toBeNull();
    });
});
