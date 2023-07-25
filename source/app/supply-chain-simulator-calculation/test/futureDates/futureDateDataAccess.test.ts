// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LoggerManager } from "../../src/util/logger";
import { expect, describe, test, jest, beforeEach } from "@jest/globals";
import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { FutureDate } from "../../src/model/futureDate";
import { FutureDateDataAccess } from "../../src/futureDates/futureDateDataAccess";
import { NeptuneMapType } from "shared/neptune/db/neptune-types";

describe("future date data access", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();
    test("will delete future dates", async () => {
        // Arrange
        const db = NeptuneDB.prototype;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.deleteById = jest.fn() as any;

        const futureDateDataAccess = new FutureDateDataAccess(db, logger);
        const futureDates: FutureDate[] = [
            {
                id: "some-id-0",
                date: new Date("2022-01-14T00:00:00"),
                daysOut: 1
            }
        ];

        // Act
        await futureDateDataAccess.deleteFutureDates(futureDates);

        // Assert
        expect(db.deleteById).toHaveBeenCalledWith("future-date", {
            id: "some-id-0"
        });
    });

    test("will update future dates", async () => {
        // Arrange
        const db = NeptuneDB.prototype;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.updateVertex = jest.fn() as any;

        const date = new Date("2022-01-14T00:00:00");

        const futureDateDataAccess = new FutureDateDataAccess(db, logger);
        const futureDates: FutureDate[] = [
            {
                id: "some-id-0",
                date: date,
                daysOut: 1
            }
        ];

        // Act
        await futureDateDataAccess.updateFutureDates(futureDates);

        // Assert
        expect(db.updateVertex).toHaveBeenCalledWith("future-date", {
            id: "some-id-0",
            date: date,
            daysOut: 1
        });
    });

    test("will create future dates", async () => {
        // Arrange
        const db = NeptuneDB.prototype;

        const date = new Date("2022-01-14T00:00:00");

        const futureDateDataAccess = new FutureDateDataAccess(db, logger);
        const futureDateV = new Map<string, NeptuneMapType>();
        futureDateV.set("id", "some-id-0");
        futureDateV.set("date", date);
        futureDateV.set("daysOut", 1);
        const futureDates: FutureDate[] = [
            {
                id: "some-id-0",
                date: date,
                daysOut: 1
            }
        ];

        db.createVertex = jest.fn().mockImplementationOnce(() => {
            return [futureDateV];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        db.getAll = jest.fn().mockImplementationOnce(() => {
            return [futureDateV];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        // Act
        await futureDateDataAccess.createFutureDates(futureDates);

        // Assert
        expect(db.createVertex).toHaveBeenCalledWith("future-date", futureDates[0]);
    });

    test("will associate future dates to all items", async () => {
        // Arrange
        const db = NeptuneDB.prototype;

        const date = new Date("2022-01-14T00:00:00");

        const futureDateDataAccess = new FutureDateDataAccess(db, logger);
        const futureDates: FutureDate[] = [
            {
                id: "some-id-0",
                date: date,
                daysOut: 1
            }
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.createEdgeForAll = jest.fn() as any;

        // Act
        await futureDateDataAccess.associateFutureDatesToAllItems(futureDates);

        // Assert
        expect(db.createEdgeForAll).toHaveBeenCalledWith("future-date", "item", "newly-projects", "some-id-0", {});
    });

    test("will get all future dates", async () => {
        // Arrange
        const db = NeptuneDB.prototype;

        const date = new Date("2022-01-14T00:00:00");

        const futureDateDataAccess = new FutureDateDataAccess(db, logger);
        const futureDateV = new Map<string, NeptuneMapType>();
        futureDateV.set("id", "some-id-0");
        futureDateV.set("date", date);
        futureDateV.set("daysOut", 1);
        const futureDates = [futureDateV];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.getAll = jest.fn().mockImplementationOnce(() => {
            return futureDates;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        // Act
        const returnedFutureDates = await futureDateDataAccess.getAllFutureDates();

        // Assert
        expect(db.getAll).toHaveBeenCalledWith("future-date");
        expect(returnedFutureDates[0].id).toBe("some-id-0");
    });
});
