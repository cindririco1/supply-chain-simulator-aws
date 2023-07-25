// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { describe, it, expect } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils";
import Content from "../../../src/components/content";

describe("Tests for content component", () => {
    it("Render Content | success | content page created", () => {
        const { container } = renderWithProviders(<Content />);
        expect(container).toBeDefined();
    });
});
