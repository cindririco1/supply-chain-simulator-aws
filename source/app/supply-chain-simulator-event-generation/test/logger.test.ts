// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, describe, test } from "@jest/globals";
import { logger } from "../src/util/logger";

describe("logger", () => {
    test("will construct ok with right log level", () => {
        expect(logger.level).toBe("info");
    });
});
