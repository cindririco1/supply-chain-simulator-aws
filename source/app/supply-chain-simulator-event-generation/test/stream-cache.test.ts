// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { expect, describe, test } from "@jest/globals";
import { StreamCache } from "../src/neptune/stream-cache";

describe("stream cache", () => {
    test("will construct ok", () => {
        const streamCache = new StreamCache();

        expect(streamCache).toBeDefined();
        expect(streamCache.latestCommitNum).toBe(-1);
    });

    test("will save latest commit num", () => {
        // Arrange
        const streamCache = new StreamCache();
        streamCache.commitNumToSave = 100;

        // Act
        streamCache.save();

        expect(streamCache.latestCommitNum).toBe(101);
    });
});
