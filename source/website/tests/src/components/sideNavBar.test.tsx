// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import "@testing-library/jest-dom";
import { describe, it } from "@jest/globals";
import { renderWithProviders } from "../../utils/test-utils";
import SideNavBar from "../../../src/components/sideNavBar";
import { fireEvent } from "@testing-library/react";

describe("Tests to make sure App layout is correct", () => {
    it("Render SideNavBar | success | navigation rendered", () => {
        const { getByText } = renderWithProviders(<SideNavBar />);

        expect(getByText("Supply Chain Simulator on AWS")).toBeInTheDocument();
        expect(getByText("Dashboard")).toBeInTheDocument();
    });

    it("Render SideNavBar | success | navigation press Dashboard", () => {
        const { getByText } = renderWithProviders(<SideNavBar />);

        fireEvent.click(getByText("Dashboard"));
    });
});
