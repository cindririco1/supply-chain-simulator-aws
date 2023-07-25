// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Item } from "./item";

export interface InvalidItem extends Item {
  description?: string;
}
