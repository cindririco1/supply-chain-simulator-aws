// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Vertex } from "./vertex";

export interface FutureDate extends Vertex {
    date: Date;
    daysOut: number;
}
