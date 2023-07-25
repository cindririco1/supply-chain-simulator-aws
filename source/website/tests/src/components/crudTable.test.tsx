// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import React from "react";
import CrudTable from "../../../src/components/crudTable";
import { AllowedTypes, CustomColumnDef } from "../../../src/components/customize-field-modal";
import { renderWithProviders } from "../../utils/test-utils";

jest.mock("../../../src/components/shared", () => {
    return {
        getItemId: jest.fn(() => {
            return "id";
        }),
        getTransfers: jest.fn(() => {
            return {
                location: 3
            };
        }),
        setCustomFields: jest.fn(() => {
            return {};
        }),
        populateTableDistributer: jest.fn(() => {
            return {};
        }),
        deleteTableItems: jest.fn(() => {}),
        postCustomColumns: jest.fn(() => {}),
        getCustomColumns: jest.fn(() => {})
    };
});

describe("Test for Crud Table", () => {
    const locationTableData = [
        {
            location: "Kindle Manufacturer 11",
            type: "manufacturer",
            userDefinedFields: "{}",
            id: "94c34a4f-f8b7-626c-e7d5-007fa84a718f"
        },
        {
            location: "kindle distributor 1",
            type: "distributor",
            userDefinedFields: "{}",
            id: "ccc34a65-9a2b-849f-a7f0-df4f446f5884"
        }
    ];

    const locationOptions = [
        {
            label: "kindle distributor 1",
            value: "94c34a4f-f8b7-626c-e7d5-007fa84a718f"
        },
        {
            label: "Kindle Manufacturer 11",
            value: "94c34a4f-f8b7-626c-e7d5-007fa84a718f"
        }
    ];

    const customCols: CustomColumnDef[] = [
        {
            fieldName: "text",
            fieldType: AllowedTypes.TEXT
        },
        {
            fieldName: "number",
            fieldType: AllowedTypes.NUMBER
        },
        {
            fieldName: "date",
            fieldType: AllowedTypes.DATE
        }
    ];
    it("Render Crud Table | success | location table created", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"location"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | item table created", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"item"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | downstream table created", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"downstream"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | upstream table created", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"upstream"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | transfer plan table created", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"transfer-plan"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | inventory plan table created", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"inventory-plan"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | random table created", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"randomw"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | Add new location then Cancel", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"location"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        fireEvent.click(screen.getByText("Add New location"));
        fireEvent.click(screen.getByText("Cancel"));

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | Edit Row", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"location"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        fireEvent.click(
            screen.getAllByRole("button", {
                name: "edit"
            })[0]
        );
        fireEvent.click(
            screen.getByRole("button", {
                name: "Save"
            })
        );
        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | Delete Row", () => {
        window.confirm = jest.fn(() => true);
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"location"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        fireEvent.click(
            screen.getAllByRole("button", {
                name: "Delete"
            })[0]
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | Edit Row then cancel", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"location"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        fireEvent.click(
            screen.getAllByRole("button", {
                name: "edit"
            })[0]
        );
        fireEvent.click(
            screen.getByRole("button", {
                name: "Cancel"
            })
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | Edit Row then cancel", () => {
        window.confirm = jest.fn(() => false);
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"location"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        fireEvent.click(
            screen.getAllByRole("button", {
                name: "Delete"
            })[0]
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | create new custom field", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"location"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Customize Fields"
            })
        );

        fireEvent.change(
            screen.getAllByRole("textbox", {
                name: "Name"
            })[0],
            { target: { value: "testing" } }
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Save"
            })
        );

        expect(container).toBeDefined();
    });

    it("Render Crud Table | success | click customize field button and then cancel", () => {
        const { container } = renderWithProviders(
            <CrudTable
                customCols={customCols}
                setTableCustomColsData={() => {}}
                tableData={locationTableData}
                setTableData={() => {}}
                dataType={"location"}
                currentLocationId={locationOptions[1].value}
                setModalError={() => {}}
                setDropdown={() => {}}
                setModalErrorMsg={() => {}}
                modalErrorMsg={""}
                setEdges={() => {}}
                setNodes={() => {}}
                locations={locationOptions}
            />
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Customize Fields"
            })
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: "Cancel"
            })
        );

        expect(container).toBeDefined();
    });
});
