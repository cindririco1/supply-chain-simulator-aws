// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { jest, describe, it, expect } from "@jest/globals";
import { renderWithProviders } from "../../utils/test-utils";
import ViewTabs from "../../../src/routes/tabs";

// TODO: This will need to be refactored as well once we start refactor this component
jest.mock("../../../src/components/shared", () => {
    return {
        getCustomColumns: jest.fn(() => {
            return [];
        }),
        getTransfers: jest.fn(() => {
            return {
                location: 3
            };
        })
    };
});

describe("Test for ViewTabs Component", () => {
    it("Render | success | Tabs Component created", () => {
        const { container } = renderWithProviders(<ViewTabs />);

        expect(container).toBeDefined();
    });
});
