// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ApiMetricsResource } from "api/apiMetrics";
import { StreamMessage } from "../types/neptune-stream-types";
import { logger } from "../util/logger";
import { SigV4 } from "./sigv4";
import { StreamCache } from "./stream-cache";

const ALLOWED_NEPTUNE_QUERY_TYPES = ["TRIM_HORIZON", "AT_SEQUENCE_NUMBER", "AFTER_SEQUENCE_NUMBER", "LATEST"];

export class StreamPoller extends ApiMetricsResource {
    private neptuneEndpoint: string;
    private neptunePort: number;
    private neptuneStreamPageSize: number;
    public streamCache: StreamCache;
    private skipToLatest: boolean;
    private sigV4: SigV4;

    constructor(neptuneEndpoint: string, neptunePort: number, neptuneStreamPageSize: number, apiMetricsKey: string) {
        super(apiMetricsKey);
        this.neptuneEndpoint = neptuneEndpoint;
        this.neptunePort = neptunePort;
        this.neptuneStreamPageSize = neptuneStreamPageSize;
        this.streamCache = new StreamCache();
        if (process.env.SKIP_TO_LATEST) {
            this.skipToLatest = true;
        }
        this.sigV4 = new SigV4();
    }

    // Each record is approximately 184 bytes. Each message includes 126 bytes of metadata
    // max limit is 100,000 or 10 MB. This comes out to about 18.4 MB if limit was set to 100,000 but half that is below
    // 10 MB with some buffer at 9.2 MB. So limit per request max should be 50,000. However, processing 9.2 MB of data
    // will cause issues with queues unless we batch up messages. It's also likely error prone to do that much at once
    // SQS has a default limit of 256 KB per message which comes out to be about 1375 messages from neptune stream. We'll stick to
    // an even 1000. This could be optimized via parallelizing the stream records in batches of 1000 (since each message is idempotent)

    // so in theory, we could run "LATEST" and get that commit number. Then run "TRIM_HORIZON" with limit of one to get earliest commit number.
    // Then we could split it up returning one "StreamMessage" per 1000 batch which index.ts then does a parallelization of
    public async getStreamMessage(): Promise<StreamMessage> {
        logger.debug("Retrieving stream message");

        let latestCommitNum = this.streamCache.latestCommitNum;
        if (latestCommitNum < 0) {
            latestCommitNum = (await this.queryNeptuneStream("TRIM_HORIZON")).lastEventId.commitNum;
        }

        let queryType = "AFTER_SEQUENCE_NUMBER";
        if (latestCommitNum <= 0) {
            queryType = "AT_SEQUENCE_NUMBER";
            latestCommitNum = 1;
        }

        if (this.skipToLatest) {
            queryType = "LATEST";
            this.skipToLatest = false;
        }

        const streamMessage = await this.queryNeptuneStream(queryType, latestCommitNum);

        this.streamCache.commitNumToSave = streamMessage.lastEventId.commitNum;
        logger.debug(`Commit number to save: ${this.streamCache.commitNumToSave}`);

        return streamMessage;
    }

    private async queryNeptuneStream(queryType: string, latestCommitNum = 0): Promise<StreamMessage> {
        if (ALLOWED_NEPTUNE_QUERY_TYPES.includes(queryType) === false) {
            throw new Error(`Query type ${queryType} not allowed`);
        }

        let path = `/gremlin/stream?iteratorType=${queryType}&limit=${this.neptuneStreamPageSize}&commitNum=${latestCommitNum}`;
        if (queryType === "TRIM_HORIZON") {
            path = `/gremlin/stream?iteratorType=${queryType}&limit=1`;
        } else if (queryType === "LATEST") {
            path = `/gremlin/stream?iteratorType=${queryType}`;
        }

        try {
            const response = await this.sigV4.sendSignedRequest(
                this.neptuneEndpoint,
                this.neptunePort,
                path,
                { method: "GET" },
                this.ApiMetricsKey
            );
            if (response.body) {
                const result = (await response.json()) as any; // NOSONAR: typescript:S4325
                if (!result.code) {
                    return (await result) as StreamMessage;
                } else if (result.code !== "StreamRecordsNotFoundException") {
                    logger.error(`Received unexpected code from neptune streams: ${JSON.stringify(result)}`);
                } else {
                    logger.debug("Received end of stream");
                }
            }
        } catch (error) {
            // printing the error and then continuing to return empty stream message
            logger.error("An error occured while retrieving stream from neptune");
            logger.error(error);
        }

        logger.debug("Returning empty stream message");
        return {
            lastEventId: {
                commitNum: latestCommitNum - 1,
                opNum: 0
            },
            lastTrxTimestamp: -1,
            format: "NONE",
            records: [],
            totalRecords: 0
        };
    }
}
