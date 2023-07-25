// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type DataChange = {
    id: string;
    op: string;
    key: string;
    label: string;
    value: DataChangeValue;
};

export type DataChangeValue = {
    value: string;
    dataType: string;
};
