// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, test } from "@jest/globals";
import { API_METRICS_SOLUTION_ID_ENV_KEY } from "shared/api/apiMetrics";
import { setup } from "../index";
import {
    apiMetricsKey,
    lambdaArnConst,
    neptuneHostConst,
    neptunePortConst,
    regionConst,
    schedulerRuleArnConst
} from "./helper/constants";

describe("index", () => {
    test("will environment variables set up correctly", () => {
        process.env.NEPTUNE_HOST = neptuneHostConst;
        process.env.NEPTUNE_PORT = neptunePortConst;
        process.env.REGION = regionConst;
        process.env.LAMBDA_FUNCTION_ARN = lambdaArnConst;
        process.env.SCHEDULER_RULE_ARN = schedulerRuleArnConst;
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = apiMetricsKey;

        setup();

        expect(neptuneHost).toBe(neptuneHostConst);
        expect(neptunePort).toBe(neptunePortConst);
        expect(region).toBe(regionConst);
        expect(lambdaArn).toBe(lambdaArnConst);
        expect(schedulerRuleArn).toBe(schedulerRuleArnConst);
    });

    test("will handle sqs correctly", () => {
        process.env.NEPTUNE_HOST = neptuneHostConst;
        process.env.NEPTUNE_PORT = neptunePortConst;
        process.env.REGION = regionConst;
        process.env.LAMBDA_FUNCTION_ARN = lambdaArnConst;
        process.env.SCHEDULER_RULE_ARN = schedulerRuleArnConst;
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = apiMetricsKey;
    });
});
