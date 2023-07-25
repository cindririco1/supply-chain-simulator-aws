// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { Destination } from "../src/destinations/destination-interface";
import { Router } from "../src/routing/router";
import { DataChange } from "../src/types/destination-message-type";
import { StreamRecord } from "../src/types/neptune-stream-types";

class MockDestination implements Destination {
    getName(): string {
        return "mock";
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public send = jest.fn((message: DataChange) => {});
}

describe("router", () => {
    beforeEach(() => {
        process.env.REGION = "test";
    });

    test("will construct ok", () => {
        // Arrange
        process.env["API_METRICS_SOLUTION_ID_ENV_KEY"] = "some-key";

        // Act
        const router = new Router("some-url", "some-url");

        // Assert
        expect(router).toBeDefined();
        expect(router.routing.get("vp")?.get("startDate")?.get("ADD")?.length).toBe(2);
        expect(router.routing.get("vp")?.get("startDate")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("endDate")?.get("ADD")?.length).toBe(2);
        expect(router.routing.get("vp")?.get("endDate")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("turnoverHour")?.get("ADD")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("turnoverHour")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("dailyRate")?.get("ADD")?.length).toBe(2);
        expect(router.routing.get("vp")?.get("dailyRate")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("shipDate")?.get("ADD")?.length).toBe(2);
        expect(router.routing.get("vp")?.get("shipDate")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("arrivalDate")?.get("ADD")?.length).toBe(2);
        expect(router.routing.get("vp")?.get("arrivalDate")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("transferAmount")?.get("ADD")?.length).toBe(2);
        expect(router.routing.get("vp")?.get("transferAmount")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("minAllowed")?.get("ADD")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("minAllowed")?.get("REMOVE")?.length).toBe(0);
        expect(router.routing.get("vp")?.get("maxAllowed")?.get("ADD")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("maxAllowed")?.get("REMOVE")?.length).toBe(0);
        expect(router.routing.get("vp")?.get("amount")?.get("ADD")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("amount")?.get("REMOVE")?.length).toBe(0);
        expect(router.routing.get("vp")?.get("itemId")?.get("ADD")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("itemId")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("fromItemId")?.get("ADD")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("fromItemId")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("toItemId")?.get("ADD")?.length).toBe(1);
        expect(router.routing.get("vp")?.get("toItemId")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vl")?.get("inventory-plan")?.get("ADD")?.length).toBe(1);
        expect(router.routing.get("vl")?.get("inventory-plan")?.get("REMOVE")?.length).toBe(1);
        expect(router.routing.get("vl")?.get("transfer-plan")?.get("ADD")?.length).toBe(1);
        expect(router.routing.get("vl")?.get("transfer-plan")?.get("REMOVE")?.length).toBe(1);
    });

    test("will route vp records", () => {
        // Arrange
        process.env["API_METRICS_SOLUTION_ID_ENV_KEY"] = "some-key";

        const routing = new Map();
        routing.set(
            "vp",
            new Map(
                Object.entries({
                    someLabel: new Map(Object.entries({ ADD: [new MockDestination()] }))
                })
            )
        );
        const router = new Router("some-url", "some-url");
        router.routing = routing;

        const streamRecord: StreamRecord = {
            eventId: {
                commitNum: 1,
                opNum: 1
            },
            data: {
                id: "",
                type: "vp",
                key: "someLabel",
                value: {
                    value: "some-value",
                    dataType: "String"
                }
            },
            commitTimestamp: 0,
            op: "ADD",
            isLastOp: false
        };

        // Act
        router.routeRecords([streamRecord]);

        // Assert
        const destination = router.routing.get("vp")?.get("someLabel")?.get("ADD")?.at(0) as MockDestination;
        expect(destination).toBeDefined();
        expect(destination.send.mock.calls.length).toBe(1);
    });

    test("will route e records", () => {
        // Arrange
        process.env["API_METRICS_SOLUTION_ID_ENV_KEY"] = "some-key";

        const routing = new Map();
        routing.set(
            "e",
            new Map(
                Object.entries({
                    someLabel: new Map(Object.entries({ ADD: [new MockDestination()] }))
                })
            )
        );
        const router = new Router("some-url", "some-url");
        router.routing = routing;

        const streamRecord: StreamRecord = {
            eventId: {
                commitNum: 1,
                opNum: 1
            },
            data: {
                id: "",
                type: "e",
                key: "label",
                value: {
                    value: "someLabel",
                    dataType: "String"
                }
            },
            commitTimestamp: 0,
            op: "ADD",
            isLastOp: false
        };

        // Act
        router.routeRecords([streamRecord]);

        // Assert
        const destination = router.routing.get("e")?.get("someLabel")?.get("ADD")?.at(0) as MockDestination;
        expect(destination).toBeDefined();
        expect(destination.send.mock.calls.length).toBe(1);
    });

    test("will route vl records", () => {
        // Arrange
        process.env["API_METRICS_SOLUTION_ID_ENV_KEY"] = "some-key";

        const routing = new Map();
        routing.set(
            "vl",
            new Map(
                Object.entries({
                    someLabel: new Map(Object.entries({ ADD: [new MockDestination()] }))
                })
            )
        );
        const router = new Router("some-url", "some-url");
        router.routing = routing;

        const streamRecord: StreamRecord = {
            eventId: {
                commitNum: 1,
                opNum: 1
            },
            data: {
                id: "",
                type: "vl",
                key: "label",
                value: {
                    value: "someLabel",
                    dataType: "String"
                }
            },
            commitTimestamp: 0,
            op: "ADD",
            isLastOp: false
        };

        // Act
        router.routeRecords([streamRecord]);

        // Assert
        const destination = router.routing.get("vl")?.get("someLabel")?.get("ADD")?.at(0) as MockDestination;
        expect(destination).toBeDefined();
        expect(destination.send.mock.calls.length).toBe(1);
    });
});
