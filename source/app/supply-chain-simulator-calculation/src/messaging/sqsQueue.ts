// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";

import {
    DeleteMessageBatchCommand,
    MessageAttributeValue,
    ReceiveMessageCommand,
    SendMessageBatchCommand,
    SQSClient,
    Message
} from "@aws-sdk/client-sqs";
import { ApiMetricsClientFactory } from "shared/api/apiMetrics";
import { DataChange } from "../types/queueMessageType";
import { CalculationQueue } from "./calculationQueueInterface";
import { deDupeById } from "../calculation/deduper";

const MAX_LONG_POLLING = 20;
const NUMBER_OF_FAILURES_ATTR_NAME = "numberOfFailures";
const MAX_FAILURES = 10;
const DELAY_SECONDS = 2;
const DELAY_SECONDS_MAX = 900;

/**
 * Interfaces with deployed SQS that is the starting point for the calculation engine's process
 */
export class SQSQueue implements CalculationQueue {
    private queueUrl: string;
    private deadletterQueueUrl: string;
    private longPollingSecondsDuration: number;
    private client: SQSClient;
    private logger: Logger;

    /**
     * News up queue interface object
     * @param queueUrl The SQS queue url to retrieve and delete messages from
     * @param deadletterQueueUrl The SQS queue url to put messages once we've retried the max
     * @param longPollingSecondsDuration How long to poll the queue, can't be longer than 20
     * @param logger
     */
    constructor(queueUrl: string, deadletterQueueUrl: string, longPollingSecondsDuration: number, logger: Logger) {
        this.logger = logger;
        this.logger.info(
            `Wiring up queue with ${queueUrl}, long polling: ${longPollingSecondsDuration}, deadletter queue ${deadletterQueueUrl}`
        );
        this.queueUrl = queueUrl;
        this.deadletterQueueUrl = deadletterQueueUrl;
        this.client = ApiMetricsClientFactory.Build<SQSClient>(SQSClient, { apiVersion: "2012-11-05" });

        if (longPollingSecondsDuration > MAX_LONG_POLLING) {
            throw new Error(`Long polling config can't be longer than ${MAX_LONG_POLLING}`);
        }

        this.longPollingSecondsDuration = longPollingSecondsDuration;
    }

    /**
     * Gets the next batch of SQS messages
     * @returns List of SQS messages corresponding to data changes that came in from stream poller
     */
    public async receive(): Promise<DataChange[]> {
        // pull more than 10 at a time for batching (requires multiple receive commands)
        const command = new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: 10,
            WaitTimeSeconds: this.longPollingSecondsDuration,
            MessageAttributeNames: [NUMBER_OF_FAILURES_ATTR_NAME]
        });

        this.logger.debug(`Receiving messages from ${this.queueUrl}`);
        const response = await this.client.send(command);

        let dataChanges: DataChange[] = [];
        if (!response.Messages) {
            this.logger.debug(`No messages found in ${this.queueUrl}`);
        } else {
            dataChanges = response.Messages.flatMap((m: Message) => {
                if (m.Body && m.MessageId && m.ReceiptHandle) {
                    const dataChange = JSON.parse(m.Body);

                    this.logger.info(`MESSAGE: ${JSON.stringify(m)}`);

                    let numberOfFailures = 0;
                    if (
                        m.MessageAttributes &&
                        m.MessageAttributes.numberOfFailures &&
                        m.MessageAttributes.numberOfFailures.StringValue
                    ) {
                        numberOfFailures = Number(m.MessageAttributes.numberOfFailures.StringValue);
                    }

                    return {
                        id: dataChange.id,
                        key: dataChange.key,
                        op: dataChange.op,
                        label: dataChange.label,
                        value: dataChange.value,
                        sqs: {
                            messageId: m.MessageId,
                            numberOfFailures: numberOfFailures,
                            receiptHandle: m.ReceiptHandle
                        }
                    };
                } else {
                    this.logger.warn(
                        `Queue message doesn't have body or message id or receipt handle: ${JSON.stringify(m)}`
                    );
                    return []; // filtering out any bad messages to avoid 'undefined' in our types
                }
            });
        }

        return dataChanges;
    }

    /**
     * Deletes messages from the queue, should only be called upon successful handling of that message
     * @param dataChanges the queue messages that now need to be deleted from the queue
     */
    public async deleteMessages(dataChanges: DataChange[]): Promise<void> {
        const deDupedDataChanges = deDupeById(dataChanges);
        if (deDupedDataChanges.length > 0) {
            const deleteCommand = new DeleteMessageBatchCommand({
                QueueUrl: this.queueUrl,
                Entries: deDupedDataChanges.map(dc => {
                    return { Id: dc.sqs.messageId, ReceiptHandle: dc.sqs.receiptHandle };
                })
            });

            this.logger.debug(`Deleting messages from ${this.queueUrl}`);
            const response = await this.client.send(deleteCommand);

            if (response.Failed && response.Failed.length > 0) {
                this.logger.error(`Failed to delete messages ${JSON.stringify(response.Failed)}`);
            }
        } else {
            this.logger.debug("Skipping delete of SQS messages because no messages to delete found");
        }
    }

    /**
     * Updates messages on the queue which should have a failure message
     * @param dataChanges the queue messages that failed
     */
    public async sendMessagesWithFailure(dataChanges: DataChange[]): Promise<void> {
        const deDupedDataChanges = deDupeById(dataChanges);

        const retryMessages = deDupedDataChanges.filter(dc => dc.sqs.numberOfFailures < MAX_FAILURES);
        const deadletterMessages = deDupedDataChanges.filter(dc => dc.sqs.numberOfFailures >= MAX_FAILURES);

        if (retryMessages.length > 0) {
            this.logger.debug(`Sending ${retryMessages.length} messages back to ${this.queueUrl}`);
            const sendMessagesCommand = this.getSendMessageBatchCommand(retryMessages, this.queueUrl, false);
            const response = await this.client.send(sendMessagesCommand);
            if (response.Failed && response.Failed.length > 0) {
                this.logger.error(`Failed to send messages ${JSON.stringify(response.Failed)}`);
            }
        } else {
            this.logger.debug("Skipping sending of failed SQS messages because no messages to send found");
        }

        if (deadletterMessages.length > 0) {
            this.logger.info(`Deadlettering ${deadletterMessages.length} messages to ${this.deadletterQueueUrl}`);
            const sendMessagesCommand = this.getSendMessageBatchCommand(
                deadletterMessages,
                this.deadletterQueueUrl,
                true
            );
            const response = await this.client.send(sendMessagesCommand);
            if (response.Failed && response.Failed.length > 0) {
                this.logger.error(`Failed to send messages to deadletter ${JSON.stringify(response.Failed)}`);
            }
        }
    }

    private getSendMessageBatchCommand(
        dataChanges: DataChange[],
        queueUrl: string,
        isDeadletter: boolean
    ): SendMessageBatchCommand {
        return new SendMessageBatchCommand({
            QueueUrl: queueUrl,
            Entries: dataChanges.map(dc => {
                return {
                    Id: dc.sqs.messageId,
                    MessageBody: JSON.stringify({
                        id: dc.id,
                        op: dc.op,
                        key: dc.key,
                        label: dc.label,
                        value: dc.value
                    }),
                    MessageAttributes: {
                        numberOfFailures: {
                            DataType: "Number",
                            StringValue: String(dc.sqs.numberOfFailures + 1)
                        }
                    } as Record<string, MessageAttributeValue>,
                    DelaySeconds: isDeadletter ? 0 : this.calculateDelaySeconds(dc.sqs.numberOfFailures)
                };
            })
        });
    }

    private calculateDelaySeconds(numberOfFailures: number): number {
        // 1 failure => 2 seconds
        // 2 failures => 4 seconds
        // 3 failures => 8 seconds
        // 4 failures => 16 seconds
        // 5 failures => 32 seconds
        // ...
        // 10 failures => 1024 seconds or 900 seconds max
        let delaySeconds = Math.pow(DELAY_SECONDS, numberOfFailures + 1);
        if (delaySeconds > DELAY_SECONDS_MAX) {
            delaySeconds = DELAY_SECONDS_MAX;
        }
        return delaySeconds;
    }
}
