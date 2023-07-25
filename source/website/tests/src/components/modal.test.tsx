// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { describe, it, expect, jest } from "@jest/globals";
import { renderWithProviders } from "../../utils/test-utils";
import CreateNewAccoutModal from "../../../src/components/modal";

jest.mock("../../../src/components/shared", () => {
    return {
        getItemId: jest.fn(() => {
            return "id";
        }),
        getTransfers: jest.fn(() => {
            return {
                location: 3
            };
        })
    };
});

describe("Tests for modal component", () => {
    it("Render Modal | success | page created", () => {
        const { container } = renderWithProviders(
            <CreateNewAccoutModal
                open={false}
                columns={[]}
                customFields={[]}
                onClose={() => {}}
                onSubmit={() => {}}
                dataType={"location"}
                skuList={[]}
                locationList={[]}
                locationId={"testLocation"}
                currentLocation={"testLocation"}
                validateDates={() => false}
                dateFieldError={false}
                formError={false}
                formErrorMsg={"error"}
            />
        );
    });
});
