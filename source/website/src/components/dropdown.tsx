// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { Select } from "@cloudscape-design/components";
import { OptionProps } from "./makeData";

interface Props {
    options: OptionProps[];
    dropdownType: string;
    onChange: (value: string) => void;
    selectedOption?: OptionProps;
    setSelectedOption?: React.Dispatch<React.SetStateAction<OptionProps>>;
}

const Dropdown: React.FC<Props> = ({ options, dropdownType, onChange, selectedOption, setSelectedOption }) => {
    //by defult the root node should be the first option in the table with according tables preloaded
    if (!selectedOption || !setSelectedOption) {
        [selectedOption, setSelectedOption] = React.useState({ label: "", value: "" }); // NOSONAR: typescript:S6440
    }

    const handleChange = async (event: any) => {
        (setSelectedOption as React.Dispatch<React.SetStateAction<OptionProps>>)(event.detail.selectedOption);
        onChange(event.detail.selectedOption.value);
    };

    return (
        <>
            <label>Select {dropdownType} name from the dropdown below:</label>
            <Select
                selectedOption={selectedOption}
                onChange={handleChange}
                options={options}
                selectedAriaLabel="Selected"
            />
        </>
    );
};

export default Dropdown;
