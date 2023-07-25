// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export interface TransferPlan {
    shipDate: Date;
    arrivalDate: Date;
    transferAmount: number;
    transferringFrom: boolean;
}
