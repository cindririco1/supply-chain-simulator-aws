// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface Value {
    value: string;
    dataType: string;
}

export interface ChangeLogEvent {
    id: string;
    op: string;
    key: string;
    label: string;
    value: Value;
}
