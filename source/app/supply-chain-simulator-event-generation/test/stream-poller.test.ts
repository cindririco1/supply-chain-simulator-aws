// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, jest, test } from "@jest/globals";
import { Response } from "node-fetch";
import { SigV4 } from "../src/neptune/sigv4";
import { StreamPoller } from "../src/neptune/stream-poller";

jest.mock("./../src/neptune/sigv4");

describe("stream poller", () => {
    test("will construct ok", () => {
        const streamPoller = new StreamPoller("some-endpoint", 8182, 1000, "some-key");

        expect(streamPoller).toBeDefined();
        expect(streamPoller.streamCache).toBeDefined();
    });

    test("will get stream message", async () => {
        // Arrange
        const pt = SigV4.prototype;
        const mockSendSignedRequest = pt.sendSignedRequest as jest.MockedFunction<typeof pt.sendSignedRequest>;

        const json = jest.fn() as jest.MockedFunction<any>;
        json.mockResolvedValue({
            lastEventId: {
                commitNum: 100,
                opNum: 0
            },
            lastTrxTimestamp: -1,
            format: "NONE",
            records: [],
            totalRecords: 0
        }); //just sample expected json return value
        mockSendSignedRequest.mockResolvedValue({ ok: true, body: {}, json } as Response); //just sample expected fetch response

        const streamPoller = new StreamPoller("some-endpoint", 8182, 1000, "some-key");

        // Act
        await streamPoller.getStreamMessage();

        expect(streamPoller.streamCache.commitNumToSave).toBe(100);
    });
});
