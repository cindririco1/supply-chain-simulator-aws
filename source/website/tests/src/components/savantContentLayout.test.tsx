// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { describe, it, expect } from "@jest/globals";
import { renderWithProviders } from "../../utils/test-utils";
import SavantContentLayout from "../../../src/components/savantContentLayout";

describe("Tests for Savant Layout", () => {
    it("Render layout | success| page created", () => {
        const { container } = renderWithProviders(<SavantContentLayout />);
        expect(container).toBeDefined();
    });
});
