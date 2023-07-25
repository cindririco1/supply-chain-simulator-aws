// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import DaysTable from "../../../src/components/daysTable";
import { render, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/extend-expect";

describe("DaysTable component", () => {
    const headersData: object[] = [
        { projectionType: "Supply (In-Transit)" },
        { projectionType: "Supply (On-Hand)" },
        { projectionType: "Inventory (BoH)" },
        { projectionType: "Inventory (EoH)" },
        { projectionType: "Demand (Planned)" }
    ];

    const mockedProjections = [
        {
            date: "2023-01-28T00:00:00.000Z",
            daysOut: 1,
            futureDateId: "9ec2f78d-fac2-0394-c6fd-60384e5a1498",
            inventoryEndingOnHand: 100,
            supplyInTransit: 0,
            supplyPlanned: 0,
            inventoryBeginningOnHand: 90,
            demandPlanned: 0,
            dateGenerated: "2023-01-27T15:29:17.978Z"
        }
    ];

    const rows = {
        supply: {
            inTransit: {},
            onHand: {}
        },
        inventory: {
            boh: {},
            eoh: {}
        },
        demand: {
            planned: {}
        }
    } as any;

    for (const projection of mockedProjections) {
        rows.supply.inTransit[`day${projection["daysOut"]}`] = projection["supplyInTransit"];
        rows.supply.onHand[`day${projection["daysOut"]}`] = projection["supplyPlanned"];
        rows.inventory.boh[`day${projection["daysOut"]}`] = projection["inventoryBeginningOnHand"];
        rows.inventory.eoh[`day${projection["daysOut"]}`] = projection["inventoryEndingOnHand"];
        rows.demand.planned[`day${projection["daysOut"]}`] = projection["demandPlanned"];
    }

    const table = headersData;
    table[0] = { ...table[0], ...rows.supply.inTransit };
    table[1] = { ...table[1], ...rows.supply.onHand };
    table[2] = { ...table[2], ...rows.inventory.boh };
    table[3] = { ...table[3], ...rows.inventory.eoh };
    table[4] = { ...table[4], ...rows.demand.planned };

    afterEach(cleanup);

    test("renders the correct number of columns", () => {
        const { container } = render(<DaysTable numDays={3} itemId={"123"} projections={table} />);
        const thElements = container.querySelectorAll("th");
        expect(thElements.length).toEqual(4);
    });

    test("renders the correct headers", () => {
        const { getByText } = render(<DaysTable numDays={3} itemId={"123"} projections={table} />);
        expect(getByText("Type")).toBeDefined();
        expect(getByText("Day 1")).toBeInTheDocument();
        expect(getByText("Day 2")).toBeInTheDocument();
        expect(getByText("Day 3")).toBeInTheDocument();
    });

    test("renders the correct headers on larger tables", () => {
        const { getByText } = render(<DaysTable numDays={30} itemId={"123"} projections={table} />);
        expect(getByText("Supply (In-Transit)")).toBeInTheDocument();
        for (let i = 1; i <= 30; i++) {
            expect(getByText(`Day ${i.toString()}`)).toBeInTheDocument();
        }
    });

    test("renders the correct data", () => {
        const { getByText } = render(<DaysTable numDays={3} itemId={"123"} projections={table} />);
        expect(getByText("Supply (In-Transit)")).toBeInTheDocument();
        expect(getByText(100)).toBeInTheDocument();
    });
});
