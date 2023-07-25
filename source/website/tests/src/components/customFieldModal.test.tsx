// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { describe, it, expect, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils";
import CustomizeFieldModal, { AllowedTypes } from "../../../src/components/customize-field-modal";

describe("Test for CustomFieldModal", () => {
    it("Render CustomFieldModal | success| create component", () => {
        const { container } = renderWithProviders(
            <CustomizeFieldModal
                open={true}
                customFields={[
                    {
                        fieldName: "test field",
                        fieldType: AllowedTypes.TEXT,
                        disabled: false
                    }
                ]}
                onClose={() => {}}
                onSubmit={() => {}}
                validateDates={() => true}
                formError={false}
            />
        );

        expect(container).toBeDefined();
    });
});
