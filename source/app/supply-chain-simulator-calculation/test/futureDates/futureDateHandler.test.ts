// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LoggerManager } from "../../src/util/logger";
import { expect, describe, test, jest } from "@jest/globals";
import { FutureDate } from "../../src/model/futureDate";
import { FutureDateDataAccess } from "../../src/futureDates/futureDateDataAccess";
import { FutureDateHandler } from "../../src/futureDates/futureDateHandler";

function generateDates(offset: number, numDays: number): Date[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < numDays; i++) {
        const day = new Date();
        day.setHours(0, 0, 0, 0);
        day.setDate(today.getDate() + i + offset);
        days.push(day);
    }

    return days;
}

function generateFutureDates(offset: number, numFutureDates: number): FutureDate[] {
    const days = generateDates(offset, numFutureDates);
    const futureDates: FutureDate[] = [];
    for (let i = 0; i < days.length; i++) {
        futureDates.push({
            date: days[i],
            daysOut: i + 1
        });
    }
    return futureDates;
}

describe("future date handler", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();

    test("will update future dates when no future dates exist", async () => {
        // Arrange
        const dataAccess = FutureDateDataAccess.prototype;
        const futureDates = generateFutureDates(1, 30);

        dataAccess.deleteFutureDates = jest.fn() as any;
        dataAccess.updateFutureDates = jest.fn() as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.getAllFutureDates = jest.fn().mockImplementationOnce(() => {
            return [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.createFutureDates = jest.fn().mockImplementationOnce(() => {
            return futureDates;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const futureDateHandler = new FutureDateHandler(dataAccess, logger);

        // Act
        await futureDateHandler.updateFutureDates();

        // Assert
        expect(dataAccess.createFutureDates).toHaveBeenCalledWith(futureDates);
        expect(dataAccess.deleteFutureDates).toHaveBeenCalledWith([]);
        expect(dataAccess.updateFutureDates).toHaveBeenCalledWith([]);
    });

    test("will update future dates when one future date has gone into the past", async () => {
        // Arrange
        const dataAccess = FutureDateDataAccess.prototype;
        const oldFutureDates = generateFutureDates(0, 30);
        const acceptedFutureDates = generateFutureDates(1, 30);

        dataAccess.deleteFutureDates = jest.fn() as any;
        dataAccess.updateFutureDates = jest.fn() as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.getAllFutureDates = jest.fn().mockImplementationOnce(() => {
            return oldFutureDates;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.createFutureDates = jest.fn().mockImplementationOnce(() => {
            return acceptedFutureDates;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const futureDateHandler = new FutureDateHandler(dataAccess, logger);

        // Act
        await futureDateHandler.updateFutureDates();

        // Assert
        expect(dataAccess.createFutureDates).toHaveBeenCalledWith(acceptedFutureDates.slice(29, 30));
        expect(dataAccess.updateFutureDates).toHaveBeenCalledWith(acceptedFutureDates.slice(0, 29));
        expect(dataAccess.deleteFutureDates).toHaveBeenCalledWith(oldFutureDates.slice(0, 1));
    });

    test("will update future dates when multiple future date have gone into the past", async () => {
        // Arrange
        const dataAccess = FutureDateDataAccess.prototype;
        const oldFutureDates = generateFutureDates(-2, 30);
        const acceptedFutureDates = generateFutureDates(1, 30);

        dataAccess.deleteFutureDates = jest.fn() as any;
        dataAccess.updateFutureDates = jest.fn() as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.getAllFutureDates = jest.fn().mockImplementationOnce(() => {
            return oldFutureDates;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.createFutureDates = jest.fn().mockImplementationOnce(() => {
            return acceptedFutureDates;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const futureDateHandler = new FutureDateHandler(dataAccess, logger);

        // Act
        await futureDateHandler.updateFutureDates();

        // Assert
        expect(dataAccess.createFutureDates).toHaveBeenCalledWith(acceptedFutureDates.slice(27, 30));
        expect(dataAccess.updateFutureDates).toHaveBeenCalledWith(acceptedFutureDates.slice(0, 27));
        expect(dataAccess.deleteFutureDates).toHaveBeenCalledWith(oldFutureDates.slice(0, 3));
    });

    test("will update more than 30 future dates when specifiying it", async () => {
        // Arrange
        const newFutureDatesConfigLen = 40;
        const dataAccess = FutureDateDataAccess.prototype;
        const futureDates = generateFutureDates(1, newFutureDatesConfigLen);

        dataAccess.deleteFutureDates = jest.fn() as any;
        dataAccess.updateFutureDates = jest.fn() as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.getAllFutureDates = jest.fn().mockImplementationOnce(() => {
            return [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.createFutureDates = jest.fn().mockImplementationOnce(() => {
            return futureDates;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const futureDateHandler = new FutureDateHandler(dataAccess, logger);

        // Act
        await futureDateHandler.updateFutureDates(newFutureDatesConfigLen);

        // Assert
        expect(dataAccess.createFutureDates).toHaveBeenCalledWith(futureDates);
        expect(dataAccess.deleteFutureDates).toHaveBeenCalledWith([]);
        expect(dataAccess.updateFutureDates).toHaveBeenCalledWith([]);
    });

    test("will update future dates when all existing future dates have gone beyond daysOut length", async () => {
        // Arrange
        const dataAccess = FutureDateDataAccess.prototype;
        const oldFutureDates = generateFutureDates(-35, 30);
        const acceptedFutureDates = generateFutureDates(1, 30);

        dataAccess.deleteFutureDates = jest.fn() as any;
        dataAccess.updateFutureDates = jest.fn() as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.getAllFutureDates = jest.fn().mockImplementationOnce(() => {
            return oldFutureDates;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dataAccess.createFutureDates = jest.fn().mockImplementationOnce(() => {
            return acceptedFutureDates;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const futureDateHandler = new FutureDateHandler(dataAccess, logger);

        // Act
        await futureDateHandler.updateFutureDates();

        // Assert
        expect(dataAccess.createFutureDates).toHaveBeenCalledWith(acceptedFutureDates);
        expect(dataAccess.updateFutureDates).toHaveBeenCalledWith([]);
        expect(dataAccess.deleteFutureDates).toHaveBeenCalledWith(oldFutureDates);
    });
});
