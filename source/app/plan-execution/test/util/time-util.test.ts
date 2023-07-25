// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, describe, test } from "@jest/globals";
import { convertDate } from "../../src/util/time-util";

describe("time-util", () => {
    test("will convert epoch timestamp to date format", () => {
        const date = new Date(1675794701946);
        expect(convertDate(date)).toBe("2023-02-07T18:31:41");
    });
});
