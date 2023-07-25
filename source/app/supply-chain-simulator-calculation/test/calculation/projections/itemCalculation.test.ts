// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LoggerManager } from "../../../src/util/logger";
import { expect, describe, test } from "@jest/globals";
import { FutureDate } from "../../../src/model/futureDate";
import { InventoryPlan } from "../../../src/model/inventoryPlan";
import { ItemCalculation } from "../../../src/calculation/projections/itemCalculation";
import { TransferPlan } from "../../../src/model/transferPlan";

describe("item calculation", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();
    test("will calculate", () => {
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

        const today = new Date("2023-01-13T00:00:00");

        const inventoryPlan1: InventoryPlan = {
            startDate: new Date("2023-01-15T00:00:00"),
            endDate: new Date("2023-02-01T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "MANUFACTURING",
            dailyRate: 10
        };
        const inventoryPlan2: InventoryPlan = {
            startDate: new Date("2023-01-10T00:00:00"),
            endDate: new Date("2023-01-31T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "MANUFACTURING",
            dailyRate: 10
        };
        const inventoryPlan3: InventoryPlan = {
            startDate: new Date("2023-02-17T00:00:00"),
            endDate: new Date("2023-02-28T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "MANUFACTURING",
            dailyRate: 10
        };
        const inventoryPlan4: InventoryPlan = {
            startDate: new Date("2023-02-01T00:00:00"),
            endDate: new Date("2023-03-28T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "MANUFACTURING",
            dailyRate: 10
        };
        const inventoryPlan5: InventoryPlan = {
            startDate: new Date("2023-01-10T00:00:00"),
            endDate: new Date("2023-03-31T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "MANUFACTURING",
            dailyRate: 10
        };
        const inventoryPlan6: InventoryPlan = {
            startDate: new Date("2023-01-13T00:00:00"),
            endDate: new Date("2023-01-14T00:00:00"),
            turnoverHour: "00:00:00",
            planType: "MANUFACTURING",
            dailyRate: 10
        };

        const transferPlan1: TransferPlan = {
            shipDate: new Date("2023-02-01T00:00:00"),
            arrivalDate: new Date("2023-02-03T00:00:00"),
            transferringFrom: true,
            transferAmount: 100
        };
        const transferPlan2: TransferPlan = {
            shipDate: new Date("2023-01-01T00:00:00"),
            arrivalDate: new Date("2023-02-04T00:00:00"),
            transferringFrom: false,
            transferAmount: 100
        };
        const transferPlan3: TransferPlan = {
            shipDate: new Date("2023-02-17T00:00:00"),
            arrivalDate: new Date("2023-03-04T00:00:00"),
            transferringFrom: false,
            transferAmount: 100
        };
        const transferPlan4: TransferPlan = {
            shipDate: new Date("2023-01-31T00:00:00"),
            arrivalDate: new Date("2023-03-04T00:00:00"),
            transferringFrom: true,
            transferAmount: 100
        };
        const transferPlan5: TransferPlan = {
            shipDate: new Date("2023-01-01T00:00:00"),
            arrivalDate: new Date("2023-03-03T00:00:00"),
            transferringFrom: false,
            transferAmount: 100
        };
        const transferPlan6: TransferPlan = {
            shipDate: new Date("2023-01-01T00:00:00"),
            arrivalDate: new Date("2023-01-12T00:00:00"),
            transferringFrom: false,
            transferAmount: 100
        };
        const transferPlan7: TransferPlan = {
            shipDate: new Date("2023-01-01T00:00:00"),
            arrivalDate: new Date("2023-02-13T00:00:00"),
            transferringFrom: false,
            transferAmount: 100
        };
        const transferPlan8: TransferPlan = {
            shipDate: new Date("2023-01-14T00:00:00"),
            arrivalDate: new Date("2023-01-19T00:00:00"),
            transferringFrom: true,
            transferAmount: 100
        };
        const transferPlan9: TransferPlan = {
            shipDate: new Date("2023-02-12T00:00:00"),
            arrivalDate: new Date("2023-02-19T00:00:00"),
            transferringFrom: true,
            transferAmount: 720
        };

        const inventoryPlans = [
            inventoryPlan1,
            inventoryPlan2,
            inventoryPlan3,
            inventoryPlan4,
            inventoryPlan5,
            inventoryPlan6
        ];

        const transferPlans = [
            transferPlan1,
            transferPlan2,
            transferPlan3,
            transferPlan4,
            transferPlan5,
            transferPlan6,
            transferPlan7,
            transferPlan8,
            transferPlan9
        ];

        const itemCalculation = new ItemCalculation("some-item-id", 120, futureDates, logger);

        // Act
        const projections = itemCalculation.calculateProjections(today, inventoryPlans, transferPlans);

        // Assert
        expect(projections.length).toBe(30);

        expect(projections[0].demandPlanned).toBe(100);
        expect(projections[0].inventoryBeginningOnHand).toBe(120);
        expect(projections[0].inventoryEndingOnHand).toBe(50);
        expect(projections[0].supplyInTransit).toBe(300);
        expect(projections[0].supplyPlanned).toBe(0);

        expect(projections[1].demandPlanned).toBe(0);
        expect(projections[1].inventoryBeginningOnHand).toBe(50);
        expect(projections[1].inventoryEndingOnHand).toBe(80);
        expect(projections[1].supplyInTransit).toBe(300);
        expect(projections[1].supplyPlanned).toBe(0);

        expect(projections[2].demandPlanned).toBe(0);
        expect(projections[2].inventoryBeginningOnHand).toBe(80);
        expect(projections[2].inventoryEndingOnHand).toBe(110);
        expect(projections[2].supplyInTransit).toBe(300);
        expect(projections[2].supplyPlanned).toBe(0);

        expect(projections[3].demandPlanned).toBe(0);
        expect(projections[3].inventoryBeginningOnHand).toBe(110);
        expect(projections[3].inventoryEndingOnHand).toBe(140);
        expect(projections[3].supplyInTransit).toBe(300);
        expect(projections[3].supplyPlanned).toBe(0);

        expect(projections[4].demandPlanned).toBe(0);
        expect(projections[4].inventoryBeginningOnHand).toBe(140);
        expect(projections[4].inventoryEndingOnHand).toBe(170);
        expect(projections[4].supplyInTransit).toBe(300);
        expect(projections[4].supplyPlanned).toBe(0);

        expect(projections[5].demandPlanned).toBe(0);
        expect(projections[5].inventoryBeginningOnHand).toBe(170);
        expect(projections[5].inventoryEndingOnHand).toBe(200);
        expect(projections[5].supplyInTransit).toBe(300);
        expect(projections[5].supplyPlanned).toBe(0);

        expect(projections[6].demandPlanned).toBe(0);
        expect(projections[6].inventoryBeginningOnHand).toBe(200);
        expect(projections[6].inventoryEndingOnHand).toBe(230);
        expect(projections[6].supplyInTransit).toBe(300);
        expect(projections[6].supplyPlanned).toBe(0);

        expect(projections[7].demandPlanned).toBe(0);
        expect(projections[7].inventoryBeginningOnHand).toBe(230);
        expect(projections[7].inventoryEndingOnHand).toBe(260);
        expect(projections[7].supplyInTransit).toBe(300);
        expect(projections[7].supplyPlanned).toBe(0);

        expect(projections[8].demandPlanned).toBe(0);
        expect(projections[8].inventoryBeginningOnHand).toBe(260);
        expect(projections[8].inventoryEndingOnHand).toBe(290);
        expect(projections[8].supplyInTransit).toBe(300);
        expect(projections[8].supplyPlanned).toBe(0);

        expect(projections[9].demandPlanned).toBe(0);
        expect(projections[9].inventoryBeginningOnHand).toBe(290);
        expect(projections[9].inventoryEndingOnHand).toBe(320);
        expect(projections[9].supplyInTransit).toBe(300);
        expect(projections[9].supplyPlanned).toBe(0);

        expect(projections[10].demandPlanned).toBe(0);
        expect(projections[10].inventoryBeginningOnHand).toBe(320);
        expect(projections[10].inventoryEndingOnHand).toBe(350);
        expect(projections[10].supplyInTransit).toBe(300);
        expect(projections[10].supplyPlanned).toBe(0);

        expect(projections[11].demandPlanned).toBe(0);
        expect(projections[11].inventoryBeginningOnHand).toBe(350);
        expect(projections[11].inventoryEndingOnHand).toBe(380);
        expect(projections[11].supplyInTransit).toBe(300);
        expect(projections[11].supplyPlanned).toBe(0);

        expect(projections[12].demandPlanned).toBe(0);
        expect(projections[12].inventoryBeginningOnHand).toBe(380);
        expect(projections[12].inventoryEndingOnHand).toBe(410);
        expect(projections[12].supplyInTransit).toBe(300);
        expect(projections[12].supplyPlanned).toBe(0);

        expect(projections[13].demandPlanned).toBe(0);
        expect(projections[13].inventoryBeginningOnHand).toBe(410);
        expect(projections[13].inventoryEndingOnHand).toBe(440);
        expect(projections[13].supplyInTransit).toBe(300);
        expect(projections[13].supplyPlanned).toBe(0);

        expect(projections[14].demandPlanned).toBe(0);
        expect(projections[14].inventoryBeginningOnHand).toBe(440);
        expect(projections[14].inventoryEndingOnHand).toBe(470);
        expect(projections[14].supplyInTransit).toBe(300);
        expect(projections[14].supplyPlanned).toBe(0);

        expect(projections[15].demandPlanned).toBe(0);
        expect(projections[15].inventoryBeginningOnHand).toBe(470);
        expect(projections[15].inventoryEndingOnHand).toBe(500);
        expect(projections[15].supplyInTransit).toBe(300);
        expect(projections[15].supplyPlanned).toBe(0);

        expect(projections[16].demandPlanned).toBe(0);
        expect(projections[16].inventoryBeginningOnHand).toBe(500);
        expect(projections[16].inventoryEndingOnHand).toBe(530);
        expect(projections[16].supplyInTransit).toBe(300);
        expect(projections[16].supplyPlanned).toBe(0);

        expect(projections[17].demandPlanned).toBe(100);
        expect(projections[17].inventoryBeginningOnHand).toBe(530);
        expect(projections[17].inventoryEndingOnHand).toBe(460);
        expect(projections[17].supplyInTransit).toBe(300);
        expect(projections[17].supplyPlanned).toBe(0);

        expect(projections[18].demandPlanned).toBe(100);
        expect(projections[18].inventoryBeginningOnHand).toBe(460);
        expect(projections[18].inventoryEndingOnHand).toBe(390);
        expect(projections[18].supplyInTransit).toBe(300);
        expect(projections[18].supplyPlanned).toBe(0);

        expect(projections[19].demandPlanned).toBe(0);
        expect(projections[19].inventoryBeginningOnHand).toBe(390);
        expect(projections[19].inventoryEndingOnHand).toBe(410);
        expect(projections[19].supplyInTransit).toBe(300);
        expect(projections[19].supplyPlanned).toBe(0);

        expect(projections[20].demandPlanned).toBe(0);
        expect(projections[20].inventoryBeginningOnHand).toBe(410);
        expect(projections[20].inventoryEndingOnHand).toBe(430);
        expect(projections[20].supplyInTransit).toBe(300);
        expect(projections[20].supplyPlanned).toBe(0);

        expect(projections[21].demandPlanned).toBe(0);
        expect(projections[21].inventoryBeginningOnHand).toBe(430);
        expect(projections[21].inventoryEndingOnHand).toBe(550);
        expect(projections[21].supplyInTransit).toBe(200);
        expect(projections[21].supplyPlanned).toBe(100);

        expect(projections[22].demandPlanned).toBe(0);
        expect(projections[22].inventoryBeginningOnHand).toBe(550);
        expect(projections[22].inventoryEndingOnHand).toBe(570);
        expect(projections[22].supplyInTransit).toBe(200);
        expect(projections[22].supplyPlanned).toBe(0);

        expect(projections[23].demandPlanned).toBe(0);
        expect(projections[23].inventoryBeginningOnHand).toBe(570);
        expect(projections[23].inventoryEndingOnHand).toBe(590);
        expect(projections[23].supplyInTransit).toBe(200);
        expect(projections[23].supplyPlanned).toBe(0);

        expect(projections[24].demandPlanned).toBe(0);
        expect(projections[24].inventoryBeginningOnHand).toBe(590);
        expect(projections[24].inventoryEndingOnHand).toBe(610);
        expect(projections[24].supplyInTransit).toBe(200);
        expect(projections[24].supplyPlanned).toBe(0);

        expect(projections[25].demandPlanned).toBe(0);
        expect(projections[25].inventoryBeginningOnHand).toBe(610);
        expect(projections[25].inventoryEndingOnHand).toBe(630);
        expect(projections[25].supplyInTransit).toBe(200);
        expect(projections[25].supplyPlanned).toBe(0);

        expect(projections[26].demandPlanned).toBe(0);
        expect(projections[26].inventoryBeginningOnHand).toBe(630);
        expect(projections[26].inventoryEndingOnHand).toBe(650);
        expect(projections[26].supplyInTransit).toBe(200);
        expect(projections[26].supplyPlanned).toBe(0);

        expect(projections[27].demandPlanned).toBe(0);
        expect(projections[27].inventoryBeginningOnHand).toBe(650);
        expect(projections[27].inventoryEndingOnHand).toBe(670);
        expect(projections[27].supplyInTransit).toBe(200);
        expect(projections[27].supplyPlanned).toBe(0);

        expect(projections[28].demandPlanned).toBe(0);
        expect(projections[28].inventoryBeginningOnHand).toBe(670);
        expect(projections[28].inventoryEndingOnHand).toBe(690);
        expect(projections[28].supplyInTransit).toBe(200);
        expect(projections[28].supplyPlanned).toBe(0);

        expect(projections[29].demandPlanned).toBe(720);
        expect(projections[29].inventoryBeginningOnHand).toBe(690);
        expect(projections[29].inventoryEndingOnHand).toBe(-10);
        expect(projections[29].supplyInTransit).toBe(200);
        expect(projections[29].supplyPlanned).toBe(0);
    });
});
