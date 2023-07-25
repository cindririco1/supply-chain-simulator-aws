// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LoggerManager } from "../../src/util/logger";
import { expect, describe, test, jest } from "@jest/globals";
import { FutureDate } from "../../src/model/futureDate";
import { Calculator } from "../../src/calculation/calculator";
import { CalculationDataAccess } from "../../src/calculation/calculationDataAccess";
import { DataChange } from "../../src/types/queueMessageType";
import { ViolationDataAccess } from "../../src/calculation/violations/violationDataAccess";

jest.mock("../../src/calculation/calculationDataAccess");

describe("calculator", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();
    const dc: DataChange = {
        id: "5fc8e84d-3aef-4730-9588-458c7fe40b8e",
        key: "amount",
        op: "ADD",
        label: "Item",
        value: { value: "120", dataType: "Int" },
        sqs: {
            messageId: "382d7edc-724d-4236-9438-1cafdd56250a",
            numberOfFailures: 0,
            receiptHandle:
                "AQEB/yu5ZczLxl8kAbYaywhbjDmVVuuOZcCHswv6FdLdks4k2x06UB4ZWAcyWfh8TKE5m/h7VTvzDXwzDxtEO0yt5Dyezsr8riCQ70/xOHNG9883YGZ+kU5UK3zPhC3M2T4fXcdtvbzYq10aQCJC+IWfz9jzKvlLJoziGbAusBlT9RhLcg6eEJrhOp5rcKFnvdYTtpZHVAztUk7tGUztVAzHwzuM+HEVlJNSt3aJErnNrmzR4ZoQKGFKJqxPLfTi1UIn5RW6MsdKypD7XtiaJXKyqvE3InK5ku6GhCgdrwZjNE6UXGRai2Ls85o6DInLChsCYOBca5RoM7XdyddjoY4jdO6YCXXvv74j06mIsnJlsdUboGWNk/XCxUWbwRKLa6fBnbGe2f0iZkH5zXHq4+1gNyeecWCytQ6/lMn/Q3xy8LCjw5h4jsXdn65xsINR8+AHtHYYrq3S0dv/+eaZsZ2UoQ=="
        }
    };
    test("will calculate", async () => {
        // Arrange
        const futureDates: FutureDate[] = [
            {
                id: "some-id-0",
                date: new Date("2022-01-14T00:00:00"),
                daysOut: 1
            },
            {
                id: "some-id-1",
                date: new Date("2022-01-15T00:00:00"),
                daysOut: 2
            },
            {
                id: "some-id-2",
                date: new Date("2022-01-16T00:00:00"),
                daysOut: 3
            },
            {
                id: "some-id-3",
                date: new Date("2022-01-17T00:00:00"),
                daysOut: 4
            },
            {
                id: "some-id-4",
                date: new Date("2022-01-18T00:00:00"),
                daysOut: 5
            },
            {
                id: "some-id-5",
                date: new Date("2022-01-19T00:00:00"),
                daysOut: 6
            },
            {
                id: "some-id-6",
                date: new Date("2022-01-20T00:00:00"),
                daysOut: 7
            },
            {
                id: "some-id-7",
                date: new Date("2022-01-21T00:00:00"),
                daysOut: 8
            },
            {
                id: "some-id-8",
                date: new Date("2022-01-22T00:00:00"),
                daysOut: 9
            },
            {
                id: "some-id-9",
                date: new Date("2022-01-23T00:00:00"),
                daysOut: 10
            },
            {
                id: "some-id-10",
                date: new Date("2022-01-24T00:00:00"),
                daysOut: 11
            },
            {
                id: "some-id-11",
                date: new Date("2022-01-25T00:00:00"),
                daysOut: 12
            },
            {
                id: "some-id-12",
                date: new Date("2022-01-26T00:00:00"),
                daysOut: 13
            },
            {
                id: "some-id-13",
                date: new Date("2022-01-27T00:00:00"),
                daysOut: 14
            },
            {
                id: "some-id-14",
                date: new Date("2022-01-28T00:00:00"),
                daysOut: 15
            },
            {
                id: "some-id-15",
                date: new Date("2022-01-29T00:00:00"),
                daysOut: 16
            },
            {
                id: "some-id-16",
                date: new Date("2022-01-30T00:00:00"),
                daysOut: 17
            },
            {
                id: "some-id-17",
                date: new Date("2022-01-31T00:00:00"),
                daysOut: 18
            },
            {
                id: "some-id-18",
                date: new Date("2022-02-01T00:00:00"),
                daysOut: 19
            },
            {
                id: "some-id-19",
                date: new Date("2022-02-02T00:00:00"),
                daysOut: 20
            },
            {
                id: "some-id-20",
                date: new Date("2022-02-03T00:00:00"),
                daysOut: 21
            },
            {
                id: "some-id-21",
                date: new Date("2022-02-04T00:00:00"),
                daysOut: 22
            },
            {
                id: "some-id-22",
                date: new Date("2022-02-05T00:00:00"),
                daysOut: 23
            },
            {
                id: "some-id-23",
                date: new Date("2022-02-06T00:00:00"),
                daysOut: 24
            },
            {
                id: "some-id-24",
                date: new Date("2022-02-07T00:00:00"),
                daysOut: 25
            },
            {
                id: "some-id-25",
                date: new Date("2022-02-08T00:00:00"),
                daysOut: 26
            },
            {
                id: "some-id-26",
                date: new Date("2022-02-09T00:00:00"),
                daysOut: 27
            },
            {
                id: "some-id-27",
                date: new Date("2022-02-10T00:00:00"),
                daysOut: 28
            },
            {
                id: "some-id-28",
                date: new Date("2022-02-11T00:00:00"),
                daysOut: 29
            },
            {
                id: "some-id-29",
                date: new Date("2022-02-12T00:00:00"),
                daysOut: 30
            }
        ];

        const calculationDataAccess = CalculationDataAccess.prototype;
        calculationDataAccess.getItemIdFromInventoryPlan = jest.fn().mockImplementationOnce(() => {
            return { itemId: "some-item-id1", dataChange: dc };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
        calculationDataAccess.getItemIdFromTransferPlanGives = jest.fn().mockImplementationOnce(() => {
            return { itemId: "some-item-id2", dataChange: dc };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
        calculationDataAccess.getItemIdFromTransferPlanTakes = jest.fn().mockImplementationOnce(() => {
            return { itemId: "some-item-id3", dataChange: dc };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        calculationDataAccess.saveProjections = jest.fn() as any;

        calculationDataAccess.getItemById = jest.fn().mockImplementationOnce(() => {
            return {
                id: "some-item-id1",
                sku: "some-sku",
                amount: 100,
                dateEntered: new Date(),
                userDefinedFields: "{}"
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        calculationDataAccess.getInventoryPlansForItem = jest.fn().mockImplementation(() => {
            return [
                {
                    startDate: new Date(),
                    endDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
                    turnoverHour: "00:00:00",
                    planType: "MANUFACTURING",
                    dailyRate: 10
                }
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        calculationDataAccess.getTransferPlansForItem = jest.fn().mockImplementation(() => {
            return [
                {
                    shipDate: new Date(),
                    arrivalDate: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
                    transferringFrom: false,
                    transferAmount: 100
                }
            ];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const calculator = new Calculator(
            CalculationDataAccess.prototype,
            ViolationDataAccess.prototype,
            futureDates,
            logger
        );

        const dataChanges: DataChange[] = [
            {
                id: "some-id",
                op: "ADD",
                key: "some-key",
                label: "inventory-plan",
                value: {
                    value: "some-value",
                    dataType: "String"
                },
                sqs: {
                    messageId: "some-id",
                    numberOfFailures: 0,
                    receiptHandle: ""
                }
            },
            {
                id: "some-id",
                op: "ADD",
                key: "some-key",
                label: "transfer-plan",
                value: {
                    value: "some-value",
                    dataType: "String"
                },
                sqs: {
                    messageId: "some-id",
                    numberOfFailures: 0,
                    receiptHandle: ""
                }
            }
        ];

        // Act
        await calculator.calculate(dataChanges);

        // Assert
        expect(calculationDataAccess.saveProjections).toHaveBeenCalledTimes(1);
    });
});
