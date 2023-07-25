// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataChange } from "../types/destination-message-type";

export interface Destination {
    send(destinationMessage: DataChange): void;
    getName(): string;
}
