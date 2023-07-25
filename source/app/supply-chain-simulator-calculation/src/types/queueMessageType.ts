// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type DataChange = {
    id: string;
    op: string;
    key: string;
    label: string;
    value: DataChangeValue;
    sqs: SQSValues;
    errorMsg?: string;
};

export type DataChangeValue = {
    value: string;
    dataType: string;
};

export type SQSValues = {
    messageId: string;
    numberOfFailures: number;
    receiptHandle: string;
};

export type QueueMessage = {
    dataChanges: DataChange[];
};

export type ItemCalculationRequest = {
    itemId: string;
    sqs?: SQSValues;
};
