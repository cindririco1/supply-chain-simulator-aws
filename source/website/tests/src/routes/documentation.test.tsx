// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { jest, describe, it, expect } from "@jest/globals";
import { renderWithProviders } from "../../utils/test-utils";
import Documentation from "../../../src/routes/documentation";

describe("Test for Documentation Component", () => {
    it("Render | success | Documentation component created", () => {
        const { container } = renderWithProviders(<Documentation />);
        expect(container).toBeDefined();
    });
});
