// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { describe, it, expect } from "@jest/globals";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../utils/test-utils";
import Dropdown from "../../../src/components/dropdown";
import { OptionProps } from "../../../src/components/makeData";

describe("Tests for Dropdown component", () => {
    it("Renders Dropdown | success| with location Options", () => {
        const selected: OptionProps = { label: "location 1", value: "1" };
        const locationOptions: OptionProps[] = [selected, { label: "location 2", value: "2" }];
        renderWithProviders(
            <Dropdown
                options={locationOptions}
                dropdownType="a location"
                onChange={(id: string) => {}}
                selectedOption={selected}
            />
        );
    });
});
