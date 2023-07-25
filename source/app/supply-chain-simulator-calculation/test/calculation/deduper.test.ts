// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, describe, test } from "@jest/globals";
import { deDupe } from "../../src/calculation/deduper";
import { DataChange } from "../../src/types/queueMessageType";

describe("deduper", () => {
    test("will dedupe", async () => {
        // Arrange
        const dataChanges: DataChange[] = [
            {
                id: "some-id",
                op: "ADD",
                key: "some-key",
                label: "inventory-plan",
                value: {
                    value: "some-value",
                    dataType: "String"
                },
                sqs: {
                    messageId: "some-id",
                    numberOfFailures: 0,
                    receiptHandle: ""
                }
            },
            {
                id: "some-id",
                op: "ADD",
                key: "some-key",
                label: "transfer-plan",
                value: {
                    value: "some-value",
                    dataType: "String"
                },
                sqs: {
                    messageId: "some-id",
                    numberOfFailures: 0,
                    receiptHandle: ""
                }
            },
            {
                id: "some-id",
                op: "REMOVE",
                key: "some-key",
                label: "transfer-plan",
                value: {
                    value: "some-value",
                    dataType: "String"
                },
                sqs: {
                    messageId: "some-id",
                    numberOfFailures: 0,
                    receiptHandle: ""
                }
            }
        ];

        // Act
        const deduped = deDupe(dataChanges);

        // Assert
        expect(deduped.length).toBe(2);
    });
});
