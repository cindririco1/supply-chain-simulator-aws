// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

import { UserAgent } from "@aws-sdk/types";

export interface ApiMetricsConstructProps {
    apiMetricsKey: string;
}

export class ApiMetricsResource {
    protected readonly ApiMetricsKey: string;

    constructor(apiMetricsKey: string) {
        this.ApiMetricsKey = apiMetricsKey;
    }
}

export class ApiMetricsClientFactory {
    /**
     * Factory method that wraps a given SDK Client and adds the customUserAgent
     * property from API_METRICS_SOLUTION_ID_ENV_KEY environment variable.
     */
    static Build<T>(type: new (config: any) => T, config: any): T {
        if (!!process.env[API_METRICS_SOLUTION_ID_ENV_KEY] === false) {
            throw new Error(`Env var ${API_METRICS_SOLUTION_ID_ENV_KEY} must be set`);
        }

        //  environment variable is in the format: "AWSSOLUTION/{solutionId}/{solutionVersion}"
        //  As of aws-sdk-js-v3 v3.345.0, this format should be passed as a single parameter to the
        //  UserAgent array of arrays.
        const envVarUserAgent = process.env[API_METRICS_SOLUTION_ID_ENV_KEY] as string;

        const customUserAgent: UserAgent = [[envVarUserAgent]];
        let t: T = new type({ customUserAgent: customUserAgent, ...config });

        return t;
    }
}

export const API_METRICS_SOLUTION_ID_ENV_KEY = "API_METRICS_SOLUTION_ID_ENV_KEY";
export const API_METRICS_HEADER_KEY = "x-amz-user-agent";
