// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    DeleteMessageBatchCommand,
    DeleteMessageBatchResult,
    ReceiveMessageCommand,
    ReceiveMessageResult,
    SendMessageBatchCommand,
    SQSClient
} from "@aws-sdk/client-sqs";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import { API_METRICS_SOLUTION_ID_ENV_KEY } from "shared/api/apiMetrics";
import { SQSQueue } from "../../src/messaging/sqsQueue";
import { DataChange } from "../../src/types/queueMessageType";
import { getErrorMessage } from "../../src/util/errorHandling";
import { LoggerManager } from "../../src/util/logger";

const sqsMock = mockClient(SQSClient);

describe("sqs queue", () => {
    beforeEach(() => {
        sqsMock.reset();
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";
    });

    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();

    test("will fail to construct with invalid longPollingSecondsDuration", async () => {
        // Act
        let failureMsg = "";
        try {
            new SQSQueue("some-url", "some-other-url", 21, logger);
        } catch (error) {
            failureMsg = getErrorMessage(error);
        }

        // Assert
        expect(failureMsg).toBe("Long polling config can't be longer than 20");
    });

    test("will return empty on receive if no messages found", async () => {
        // Arrange
        const messages: ReceiveMessageResult = {
            Messages: [{}]
        };
        sqsMock.on(ReceiveMessageCommand).resolves(messages);

        const queue = new SQSQueue("some-url", "some-other-url", 20, logger);

        // Act
        const dataChanges = await queue.receive();

        // Assert
        expect(dataChanges.length).toBe(0);
    });

    test("will return empty on receive if messages don't have body and message id and receipt handle", async () => {
        // Arrange
        const mockedMessages: ReceiveMessageResult = {
            // no message id or receipt handle will nullify message from being processed
            Messages: [
                {
                    Body: "{}"
                }
            ]
        };
        sqsMock.on(ReceiveMessageCommand).resolves(mockedMessages);
        const queue = new SQSQueue("some-url", "some-other-url", 20, logger);

        // Act
        const messages = await queue.receive();

        // Assert
        expect(messages).toEqual([]);
    });

    test("will return messages on receive", async () => {
        // Arrange
        const dataChange = {
            id: "stub-id",
            op: "ADD",
            key: "some-key",
            label: "some-label",
            value: {
                value: "some-string",
                dataType: "string"
            }
        };
        const dataChanges: DataChange[] = [
            {
                id: "stub-id",
                op: "ADD",
                key: "some-key",
                label: "some-label",
                value: {
                    value: "some-string",
                    dataType: "string"
                },
                sqs: {
                    messageId: "stub-message-id",
                    numberOfFailures: 0,
                    receiptHandle: "some-receipt-handle"
                }
            }
        ];
        const mockedMessages: ReceiveMessageResult = {
            Messages: [
                {
                    Body: JSON.stringify(dataChange),
                    MessageId: "stub-message-id",
                    ReceiptHandle: "some-receipt-handle"
                }
            ]
        };
        sqsMock.on(ReceiveMessageCommand).resolves(mockedMessages);
        const queue = new SQSQueue("some-url", "some-other-url", 20, logger);

        // Act
        const messages = await queue.receive();

        // Assert
        expect(messages).toEqual(dataChanges);
    });

    test("will delete messages on delete", async () => {
        // Arrange
        const dataChanges: DataChange[] = [
            {
                id: "stub-id",
                op: "ADD",
                key: "some-key",
                label: "some-label",
                value: {
                    value: "some-string",
                    dataType: "string"
                },
                sqs: {
                    messageId: "stub-message-id",
                    numberOfFailures: 0,
                    receiptHandle: "some-receipt-handle"
                }
            }
        ];
        const mockedDeleteResult: DeleteMessageBatchResult = {
            Failed: [],
            Successful: [{ Id: "stub-message-id" }]
        };
        sqsMock.on(DeleteMessageBatchCommand).resolves(mockedDeleteResult);
        const queue = new SQSQueue("some-url", "some-other-url", 20, logger);

        const expectedDeleteCommand = {
            input: {
                QueueUrl: "some-url",
                Entries: [
                    {
                        Id: "stub-message-id",
                        ReceiptHandle: "some-receipt-handle"
                    }
                ]
            }
        } as DeleteMessageBatchCommand;

        // Act
        await queue.deleteMessages(dataChanges);

        // Assert
        expect(sqsMock.send.callCount).toBe(1);
        const r = sqsMock.send.getCall(0);
        expect(r.args[0].input).toEqual(expectedDeleteCommand.input);
    });

    test("will not delete messages on delete when passing in empty list", async () => {
        // Arrange
        const dataChanges: DataChange[] = [];
        const mockedDeleteResult: DeleteMessageBatchResult = {
            Failed: [],
            Successful: []
        };
        sqsMock.on(DeleteMessageBatchCommand).resolves(mockedDeleteResult);
        const queue = new SQSQueue("some-url", "some-other-url", 20, logger);

        // Act
        await queue.deleteMessages(dataChanges);

        // Assert
        expect(sqsMock.send.callCount).toBe(0);
    });

    test("will send messages with failure when called, incrementing delay seconds", async () => {
        // Arrange
        const dataChange = {
            id: "stub-id",
            op: "ADD",
            key: "some-key",
            label: "some-label",
            value: {
                value: "some-string",
                dataType: "string"
            }
        };
        const dataChanges: DataChange[] = [
            {
                id: "stub-id",
                op: "ADD",
                key: "some-key",
                label: "some-label",
                value: {
                    value: "some-string",
                    dataType: "string"
                },
                sqs: {
                    messageId: "stub-message-id",
                    numberOfFailures: 4,
                    receiptHandle: "some-receipt-handle"
                }
            }
        ];

        const expectedSendBatchCommand = {
            input: {
                QueueUrl: "some-url",
                Entries: [
                    {
                        Id: "stub-message-id",
                        MessageBody: JSON.stringify(dataChange),
                        MessageAttributes: {
                            numberOfFailures: {
                                DataType: "Number",
                                StringValue: "5"
                            }
                        },
                        DelaySeconds: 32
                    }
                ]
            }
        };

        sqsMock.on(SendMessageBatchCommand).resolves({});
        const queue = new SQSQueue("some-url", "some-other-url", 20, logger);

        // Act
        await queue.sendMessagesWithFailure(dataChanges);

        // Assert
        const r = sqsMock.send.getCall(0);
        expect(r.args[0].input).toEqual(expectedSendBatchCommand.input);
    });

    test("SQS Queue | success | deadletter when number of failures >= 10", async () => {
        // Arrange
        const dataChange = {
            id: "stub-id",
            op: "ADD",
            key: "some-key",
            label: "some-label",
            value: {
                value: "some-string",
                dataType: "string"
            }
        };
        const dataChanges: DataChange[] = [
            {
                id: "stub-id",
                op: "ADD",
                key: "some-key",
                label: "some-label",
                value: {
                    value: "some-string",
                    dataType: "string"
                },
                sqs: {
                    messageId: "stub-message-id",
                    numberOfFailures: 10,
                    receiptHandle: "some-receipt-handle"
                }
            }
        ];

        const expectedSendBatchCommand = {
            input: {
                QueueUrl: "some-deadletter-url",
                Entries: [
                    {
                        Id: "stub-message-id",
                        MessageBody: JSON.stringify(dataChange),
                        MessageAttributes: {
                            numberOfFailures: {
                                DataType: "Number",
                                StringValue: "11"
                            }
                        },
                        DelaySeconds: 0
                    }
                ]
            }
        };

        sqsMock.on(SendMessageBatchCommand).resolves({});
        const queue = new SQSQueue("some-url", "some-deadletter-url", 20, logger);

        // Act
        await queue.sendMessagesWithFailure(dataChanges);

        // Assert
        const r = sqsMock.send.getCall(0);
        expect(r.args[0].input).toEqual(expectedSendBatchCommand.input);
    });

    test("will not send messages on failure when passing in empty list", async () => {
        // Arrange
        const dataChanges: DataChange[] = [];
        sqsMock.on(SendMessageBatchCommand).resolves({});
        const queue = new SQSQueue("some-url", "some-other-url", 20, logger);

        // Act
        await queue.sendMessagesWithFailure(dataChanges);

        // Assert
        expect(sqsMock.send.callCount).toBe(0);
    });
});
