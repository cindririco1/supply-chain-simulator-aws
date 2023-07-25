// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { StreamPoller } from "./neptune/stream-poller";
import { Router } from "./routing/router";
import { Config } from "./util/config";
import { logger } from "./util/logger";

async function main(): Promise<void> {
    logger.info("Starting Stream Poller App");

    const config = new Config();
    const streamPoller = new StreamPoller(
        config.neptuneEndpoint,
        config.neptunePort,
        config.neptuneStreamPageSize,
        config.apiMetricsKey
    );
    const router = new Router(config.calculationServiceQueueUrl, config.planExecutionQueueUrl);

    let execute = true;
    while (execute) {
        try {
            logger.debug("Starting loop to check stream");
            const streamMessage = await streamPoller.getStreamMessage();
            logger.debug(`Stream cache latest commit: ${streamPoller.streamCache.latestCommitNum}`);
            router.routeRecords(streamMessage.records);
            streamPoller.streamCache.save();

            await new Promise(r => setTimeout(r, config.timeInterval));
        } catch (e) {
            logger.error(e);
            execute = false;
        }
    }

    logger.info("Exiting Stream Poller App");
}

main();
