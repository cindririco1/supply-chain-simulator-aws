// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface SQSEvent {
    Records: SQSRecord[];
}

export interface SQSRecord {
    body: string;
}
