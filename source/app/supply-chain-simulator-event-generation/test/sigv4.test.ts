// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import aws4 = require("aws4");
import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import fetch, { Response } from "node-fetch";
import { SigV4 } from "../src/neptune/sigv4";

jest.mock("node-fetch");
jest.mock("aws4");

const mockResolvePromise = jest.fn().mockImplementation(() => {
    return {
        accessKeyId: "test-access-key-id",
        secretAccessKey: "test-secret-key",
        sessionToken: "test-session-token"
    };
});

describe("sigv4", () => {
    const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    const mockAws4 = aws4 as jest.Mocked<typeof aws4>;

    beforeEach(() => {
        mockResolvePromise.mockClear();
        mockAws4.sign.mockClear();
        mockFetch.mockClear();
    });

    test("will send signed request", async () => {
        // Arrange
        process.env.REGION = "some-region";
        const json = jest.fn() as jest.MockedFunction<any>;
        json.mockResolvedValue({ status: 200 }); //just sample expected json return value
        mockFetch.mockResolvedValue({ ok: true, json } as Response); //just sample expected fetch response
        const sigv4 = new SigV4();

        // Act
        await sigv4.sendSignedRequest("some-host", 8182, "some-path", { method: "GET" }, "some-key");

        // Assert
        expect(mockFetch.mock.calls.length).toBe(1);
        expect(mockAws4.sign.mock.calls.length).toBe(1);
    });
});
