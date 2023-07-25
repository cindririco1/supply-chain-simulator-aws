// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SendMessageCommand, SendMessageCommandInput, SQSClient } from "@aws-sdk/client-sqs";
import { beforeEach, describe, expect, test } from "@jest/globals";
import { API_METRICS_SOLUTION_ID_ENV_KEY } from "api/apiMetrics";
import { mockClient } from "aws-sdk-client-mock";
import { QueueDestination } from "../src/destinations/queue/queue-destination";
import { DataChange } from "../src/types/destination-message-type";
const sqsMock = mockClient(SQSClient);

describe("queue destination", () => {
    beforeEach(() => {
        process.env.REGION = "test";
        sqsMock.reset();
        process.env[API_METRICS_SOLUTION_ID_ENV_KEY] = "AWSSOLUTIONS/SO0234/v1.0.0";
    });

    test("will construct ok", () => {
        // Act
        const queueDestination = new QueueDestination("some-name", "some-url");

        // Assert
        expect(queueDestination).toBeDefined();
    });

    test("will send", async () => {
        // Arrange
        const queueDestination = new QueueDestination("some-name", "some-url");

        const dataChange: DataChange = {
            id: "some-id",
            op: "ADD",
            label: "some-label",
            key: "some-key",
            value: {
                value: "some-value",
                dataType: "String"
            }
        };
        const expectedSendMessageCommand: SendMessageCommandInput = {
            MessageBody: JSON.stringify(dataChange),
            QueueUrl: "some-url"
        };

        sqsMock.on(SendMessageCommand).resolves({
            MessageId: "someId"
        });

        // Act
        await queueDestination.send(dataChange);

        // Assert
        const result = sqsMock.send.getCall(0);
        expect(result.args[0].input).toEqual(expectedSendMessageCommand);
    });

    test("will get name", () => {
        // Arrange
        const queueDestination = new QueueDestination("some-name", "some-url");

        // Act
        const name = queueDestination.getName();

        // Assert
        expect(name).toBe("some-name");
    });
});
