// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataChange } from "../types/queueMessageType";

export interface CalculationQueue {
    receive(): Promise<DataChange[]>;
    deleteMessages(dataChanges: DataChange[]): Promise<void>;
    sendMessagesWithFailure(dataChanges: DataChange[]): Promise<void>;
}
