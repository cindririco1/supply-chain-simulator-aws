// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { describe, it, expect } from "@jest/globals";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils";
import Breadcrumbs from "../../../src/components/breadcrumbs";

describe("Tests for breadcrumb component", () => {
    it("Render breadcrumbs | success | breadcrumbs created", () => {
        renderWithProviders(<Breadcrumbs />);
        expect(screen.getByText("Supply Chain Simulator on AWS")).toBeDefined();
    });
});
