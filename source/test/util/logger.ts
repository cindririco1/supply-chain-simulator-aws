// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Pino from "pino";

export const logger = Pino({
    name: "integration-test",
    level: process.env.LOG_LEVEL === undefined ? "info" : process.env.LOG_LEVEL
});
