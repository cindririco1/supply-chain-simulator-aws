// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { fireEvent } from "@testing-library/react";
import { Auth } from "aws-amplify";
import React from "react";
import DashboardHeader from "../../../src/components/dashboardHeader";
import "@testing-library/jest-dom";
import { renderWithProviders } from "../../utils/test-utils";
import { setPath } from "../../../src/app/reducers/routeSlice";
import { setupStore } from "../../../src/app/store";
import { describe, jest, expect, afterEach, it } from "@jest/globals";

describe("NavBar component", () => {
    const mockedSignOut = jest.spyOn(Auth, "signOut").mockImplementation(() => Promise.resolve());
    afterEach(() => {
        jest.clearAllMocks();
    });

    it("NavBar | success| renders", () => {
        const { getByText } = renderWithProviders(<DashboardHeader />);
        expect(getByText("Dashboard")).toBeDefined();
        expect(getByText("Sign out")).toBeDefined();
    });

    it(" NavBar | success | sign out", async () => {
        const { getByText } = renderWithProviders(<DashboardHeader />);
        fireEvent.click(getByText("Sign out"));
        expect(mockedSignOut).toHaveBeenCalled();
    });

    it("NavBar | failure | ", async () => {
        jest.spyOn(global.console, "log").mockImplementation(() => {});
        mockedSignOut.mockImplementation(() => Promise.reject("error"));
        const store = setupStore();
        store.dispatch(setPath("/test"));
        const { getByText } = renderWithProviders(<DashboardHeader />, { store });

        expect(getByText("Test")).toBeDefined();
    });
});
