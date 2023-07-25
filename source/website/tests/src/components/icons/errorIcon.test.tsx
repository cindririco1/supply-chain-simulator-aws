// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { describe, it, expect, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../../utils/test-utils";
import ErrorIcon from "../../../../src/components/icons/errorIcon";

describe("Test for Error Icon", () => {
    it("Render | success | icon created", () => {
        const { container } = renderWithProviders(<ErrorIcon />);
        expect(container).toBeDefined();
    });
});
