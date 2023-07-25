// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiMetricsConstructProps, API_METRICS_SOLUTION_ID_ENV_KEY } from "api/apiMetrics";

export class Config implements ApiMetricsConstructProps {
    timeInterval: number;
    neptuneEndpoint: string;
    neptuneStreamPageSize: number;
    neptunePort: number;
    calculationServiceQueueUrl: string;
    planExecutionQueueUrl: string;
    apiMetricsKey: string;

    constructor() {
        if (process.env.TIME_INTERVAL) {
            this.timeInterval = Number(process.env.TIME_INTERVAL);
        } else {
            throw new Error("Env var TIME_INTERVAL must be set");
        }

        if (process.env.NEPTUNE_ENDPOINT) {
            this.neptuneEndpoint = process.env.NEPTUNE_ENDPOINT;
        } else {
            throw new Error("Env var NEPTUNE_ENDPOINT must be set");
        }

        if (this.neptuneEndpoint.substring(0, 4) === "http") {
            throw new Error("Env var NEPTUNE_ENDPOINT should just be domains and subdomains");
        }

        if (process.env.NEPTUNE_STREAM_PAGE_SIZE) {
            this.neptuneStreamPageSize = Number(process.env.NEPTUNE_STREAM_PAGE_SIZE);
        } else {
            throw new Error("Env var NEPTUNE_STREAM_PAGE_SIZE must be set");
        }

        if (process.env.NEPTUNE_PORT) {
            this.neptunePort = Number(process.env.NEPTUNE_PORT);
        } else {
            throw new Error("Env var NEPTUNE_PORT must be set");
        }

        if (process.env.CALCULATION_SERVICE_QUEUE_URL) {
            this.calculationServiceQueueUrl = process.env.CALCULATION_SERVICE_QUEUE_URL;
        } else {
            throw new Error("Env var CALCULATION_SERVICE_QUEUE_URL must be set");
        }

        if (process.env.PLAN_EXECUTION_QUEUE_URL) {
            this.planExecutionQueueUrl = process.env.PLAN_EXECUTION_QUEUE_URL;
        } else {
            throw new Error("Env var PLAN_EXECUTION_QUEUE_URL must be set");
        }

        if (process.env[API_METRICS_SOLUTION_ID_ENV_KEY]) {
            this.apiMetricsKey = process.env[API_METRICS_SOLUTION_ID_ENV_KEY];
        } else {
            throw new Error(`Env var ${API_METRICS_SOLUTION_ID_ENV_KEY} must be set`);
        }
    }
}
