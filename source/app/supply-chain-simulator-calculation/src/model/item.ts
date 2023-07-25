// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Vertex } from "shared/neptune/model/vertex";

export interface Item extends Vertex {
    sku: string;
    amount: number;
    dateEntered: Date;
    userDefinedFields: string;
}
