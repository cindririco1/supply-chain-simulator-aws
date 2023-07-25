// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Vertex } from "./vertex";

export interface Rule extends Vertex {
    name: string;
    minAllowed: number;
    maxAllowed: number;
}
