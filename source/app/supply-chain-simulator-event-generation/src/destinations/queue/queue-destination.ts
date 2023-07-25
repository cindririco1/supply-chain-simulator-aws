// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SendMessageCommand, SendMessageCommandInput, SendMessageCommandOutput, SQSClient } from "@aws-sdk/client-sqs";
import { ApiMetricsClientFactory } from "api/apiMetrics";
import { DataChange } from "../../types/destination-message-type";
import { logger } from "../../util/logger";
import { Destination } from "../destination-interface";

export class QueueDestination implements Destination {
    private queueUrl: string;
    private queueName: string;
    private sqs: SQSClient;

    constructor(queueName: string, queueUrl: string) {
        logger.info(`Wiring up queue with ${queueUrl}`);
        this.queueName = queueName;
        this.queueUrl = queueUrl;

        const region = process.env.REGION;

        if (region === undefined) {
            throw new Error("must define REGION environment variable");
        }

        this.sqs = ApiMetricsClientFactory.Build(SQSClient, { region: region, apiVersion: "2012-11-05" });
    }

    public async send(dataChange: DataChange): Promise<void> {
        const params: SendMessageCommandInput = {
            MessageBody: JSON.stringify(dataChange),
            QueueUrl: this.queueUrl
        };
        const sendMessageCommand = new SendMessageCommand(params);

        logger.debug(`Sending message to ${this.queueName} queue`);

        const response: SendMessageCommandOutput = await this.sqs.send(sendMessageCommand);
        logger.debug(`Success while sending to queue: ${response.MessageId}`);
    }

    public getName(): string {
        return this.queueName;
    }
}
