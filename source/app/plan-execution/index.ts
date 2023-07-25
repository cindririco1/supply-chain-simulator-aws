// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { SchedulerHandler } from "./src/handler/scheduler-handler";
import { SQSHandler } from "./src/handler/sqs-handler";
import { SchedulerInput } from "./src/model/scheduler";
import { SQSEvent } from "./src/model/sqs-types";
import { NeptuneProxy } from "./src/proxy/neptune-proxy";
import { SchedulerProxy } from "./src/proxy/scheduler-proxy";
import { logger } from "./src/util/logger";

/* eslint no-var: off */
declare global {
    var neptuneHost: string; // NOSONAR: typescript:S3504
    var neptunePort: string; // NOSONAR: typescript:S3504
    var region: string; // NOSONAR: typescript:S3504
    var lambdaArn: string; // NOSONAR: typescript:S3504
    var schedulerRuleArn: string; // NOSONAR: typescript:S3504
    var apiMetricsSolutionKey: string; // NOSONAR: typescript:S3504
    var scheduleGroupName: string; // NOSONAR: typescript:S3504
}

export async function handler(event: SQSEvent | SchedulerInput): Promise<void> {
    logger.debug(`Event: ${JSON.stringify(event, null, 2)}`);
    setup();

    const neptuneProxy = new NeptuneProxy(new NeptuneDB());
    const sqsHandler = new SQSHandler(new SchedulerProxy(), neptuneProxy);
    const schedulerHandler = new SchedulerHandler(neptuneProxy);

    if ("Records" in event) {
        // SQS Event
        const { Records } = event;
        await sqsHandler.handleSQSEvent(Records);
    } else {
        // Customized EventBridge Scheduler Input
        await schedulerHandler.handleSchedulerInput(event);
    }
}

export function setup() {
    globalThis.neptuneHost = process.env.NEPTUNE_HOST || "";
    globalThis.neptunePort = process.env.NEPTUNE_PORT || "";
    globalThis.region = process.env.REGION || "us-east-1";
    globalThis.lambdaArn = process.env.LAMBDA_FUNCTION_ARN || "";
    globalThis.schedulerRuleArn = process.env.SCHEDULER_RULE_ARN || "";
    globalThis.scheduleGroupName = process.env.SCHEDULE_GROUP_NAME || "";
}
