// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { describe, it, expect } from "@jest/globals";
import { renderWithProviders } from "../../../utils/test-utils";
import CloudScapeIcon from "../../../../src/components/icons/cloudScapeIcon";
import { IconName } from "../../../../src/models/enums/iconName";

describe("Test for Cloudscape Icon", () => {
    it("Render | success | icon created", () => {
        const { container } = renderWithProviders(<CloudScapeIcon iconName={IconName.EDIT} />);

        expect(container).toBeDefined();
    });
});
