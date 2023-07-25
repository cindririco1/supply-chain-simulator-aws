// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";
import Grid from "@cloudscape-design/components/grid";
import { IconButton, Tooltip } from "@mui/material";
import MaterialReactTable, { MaterialReactTableProps, MRT_ColumnDef, MRT_Row } from "material-react-table";
import { Location } from "neptune/model/location";
import { Vertex } from "neptune/model/vertex";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CustomizeFieldModal, { AllowedTypes, CustomColumnDef } from "./customize-field-modal";
import CreateNewAccountModal from "./modal";
import {
    deleteTableItems,
    getCustomColumns,
    getItemId,
    populateTableDistributer,
    postCustomColumns,
    postTableContent,
    setCustomFields,
    updateTableItems
} from "./shared";

import * as Case from "case";
import {
    useDeleteLocationMutation,
    usePostLocationMutation,
    usePutLocationMutation
} from "../app/reducers/locationSlice";
import { VertexLabel } from "../constants";
import { IconName } from "../models/enums/iconName";
import CloudScapeIcon from "./icons/cloudScapeIcon";
import {
    downstreamColumnDef,
    inventoryColumnDef,
    inventoryPlansColumnDef,
    locationColumnDef,
    OptionProps,
    transferPlansColumnDef,
    upstreamColumnDef
} from "./makeData";
import { checkStringIsAlphaNumerical, trimAllWhiteSpaces } from "../utils/stringHelper";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { locationItem } from "../types/helperTypes";
dayjs.extend(utc);

interface Props {
    customCols: CustomColumnDef[];
    setTableCustomColsData: React.Dispatch<React.SetStateAction<CustomColumnDef[]>>;
    tableData: Array<Vertex>;
    setTableData: React.Dispatch<React.SetStateAction<Vertex[]>>;
    dataType: string;
    currentLocationId: string;
    setDropdown?: React.Dispatch<React.SetStateAction<OptionProps[]>>;
    skuList?: string[];
    setSkuList?: React.Dispatch<React.SetStateAction<string[]>>;
    setModalError: React.Dispatch<React.SetStateAction<boolean>>;
    modalErrorMsg: string;
    setModalErrorMsg: React.Dispatch<React.SetStateAction<string>>;
    locations?: OptionProps[];
    /* eslint-disable @typescript-eslint/no-explicit-any */
    setNodes?: React.Dispatch<React.SetStateAction<any>>;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    setEdges?: React.Dispatch<React.SetStateAction<any>>;
    selectedLocation?: Location;
    setErrorType?: React.Dispatch<React.SetStateAction<string>>;
    errorType?: string;
    enableEditing?: boolean;
}

const CRUDTable: React.FC<Props> = ({
    customCols,
    setTableCustomColsData,
    tableData,
    setTableData,
    dataType,
    currentLocationId,
    setDropdown,
    skuList,
    setSkuList,
    setModalError,
    modalErrorMsg,
    setModalErrorMsg,
    setErrorType,
    locations,
    setNodes,
    setEdges,
    selectedLocation,
    errorType,
    enableEditing = true
}) => {
    let currentLocation = "";

    // This should eventually be moved into it's own table
    const [createNewLocation] = usePostLocationMutation();
    const [updateLocation] = usePutLocationMutation();
    const [deleteLocation] = useDeleteLocationMutation();

    const [dateFieldError, setDateFieldError] = useState<boolean>(false);
    const [formError, setFormError] = useState<boolean>(false);
    const mapLocationID: Map<string, string> = new Map();
    const locationList: string[] = [];
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [customModalOpen, setCustomModalOpen] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [customColumns, setCustomColumns] = useState<CustomColumnDef[]>(customCols);

    const [validationErrors, setValidationErrors] = useState<{
        [cellId: string]: string;
    }>({});

    if (locations)
        for (const obj of locations) {
            locationList.push(obj["label"]);
            mapLocationID.set(obj["label"], obj["value"]);
            if (obj["value"] === currentLocationId) currentLocation = obj["label"];
        }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(false);
        };
        fetchData();
    }, []);

    useEffect(() => {
        setCustomColumns(customCols);
    }, [customCols]);

    const validateDates = (
        firstDateStr: string,
        secondDateStr: string,
        setError: React.Dispatch<React.SetStateAction<boolean>>,
        setErrorMsg: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const currDate = new Date();
        const currDateArr = currDate.toISOString().split("T");
        const firstDate = new Date(firstDateStr + "T" + currDateArr[1]);
        const secondDate = new Date(secondDateStr + "T" + currDateArr[1]);
        const firstDatePointer = dataType === "inventory-plan" ? "Start Date" : "Ship Date";
        const secondDatePointer = dataType === "inventory-plan" ? "End Date" : "Arrival Date";
        const date = dayjs().add(1, "day");

        if (firstDate < new Date(date.format("YYYY-MM-DD"))) {
            setError(true);
            setErrorMsg(`${firstDatePointer} cannot be in the past`);
            return false;
        }
        if (firstDate > secondDate) {
            setErrorMsg(`${secondDatePointer} cannot be before ${firstDatePointer}`);
            setError(true);
            return false;
        }
        return true;
    };

    const handleCreateSubmit = async (
        values: any,
        setTurnoverHourFieldError: React.Dispatch<React.SetStateAction<boolean>>,
        setLeadTimeError: React.Dispatch<React.SetStateAction<boolean>>,
        setDateFieldMsg: React.Dispatch<React.SetStateAction<string>>,
        setDailyRateFieldError: React.Dispatch<React.SetStateAction<string>>,
        itemId: string
    ) => {
        let submitSuccess = false;
        setFormError(false);
        setDateFieldError(false);
        setTurnoverHourFieldError(false);
        setLeadTimeError(false);
        const firstDatesKey = dataType === "inventory-plan" ? "date" : "shipDate";
        const secondDatesKey = dataType === "inventory-plan" ? "endDate" : "arrivalDate";
        const datesValidated =
            dataType === "inventory-plan" || dataType === "transfer-plan"
                ? validateDates(values[firstDatesKey], values[secondDatesKey], setDateFieldError, setDateFieldMsg)
                : true;
        const turnoverHourFailure =
            dataType === "inventory-plan" ? values["turnoverHour"] < 0 || values["turnoverHour"] > 24 : false;

        const leadTimeFailure = dataType === "downstream" || dataType === "upstream" ? values["leadTime"] <= 0 : false;

        setTurnoverHourFieldError(turnoverHourFailure);
        setLeadTimeError(leadTimeFailure);

        if (datesValidated && !turnoverHourFailure && !leadTimeFailure) {
            submitSuccess = await handleCreateNewRow(values, itemId);
        }
        if (submitSuccess) onCreateModalClose();
        else {
            if (datesValidated && !turnoverHourFailure && !leadTimeFailure) setFormError(true);
        }
    };

    const handleCustomSubmit = async (columns: CustomColumnDef[], deletedColumns: CustomColumnDef[]) => {
        const allValid = columns.every(col => checkStringIsAlphaNumerical(col.fieldName));
        if (allValid) {
            await postCustomColumns(dataType, columns, deletedColumns);
        } else {
            window.alert("Please use only alphanumerical characters, -, and _");
        }

        const custCols = await getCustomColumns(dataType, setTableCustomColsData);
        populateTableDistributer(setTableData, dataType, custCols, setDropdown, setSkuList, currentLocationId, {
            setNodes,
            setEdges
        });
        setCustomModalOpen(false);
    };

    const onCreateModalClose = () => {
        setFormError(false);
        setDateFieldError(false);
        setCreateModalOpen(false);
    };

    const onCustomModalClose = () => {
        setFormError(false);
        setCustomModalOpen(false);
    };

    const handleCreateNewRow = async (values: any, itemId: string): Promise<boolean> => {
        tableData.push(values);

        if (dataType === "transfer-plan") values["fromLocation"] = currentLocation;
        // Placing this here for the initial Redux refactor and it should abstracted out when the full refactor in M2.
        if (dataType === VertexLabel.LOCATION) {
            const newLocation: Location = {
                description: trimAllWhiteSpaces(values["location"]),
                type: values["type"],
                userDefinedFields: setCustomFields(customColumns, values)
            };
            try {
                await createNewLocation(newLocation).unwrap();
            } catch (error: any) {
                setModalError(true);
                setModalErrorMsg(error.data.message);
            }
            return true;
        } else {
            const postSuccess = await postTableContent(
                values,
                dataType,
                mapLocationID,
                customColumns,
                { itemId: itemId, locationId: currentLocationId },
                setModalErrorMsg,
                setErrorType
            );
            populateTableDistributer(
                setTableData,
                dataType,
                customColumns,
                setDropdown,
                setSkuList,
                currentLocationId,
                {
                    setNodes,
                    setEdges
                }
            );
            return postSuccess;
        }
    };

    // Function to handle SKU for plan data types
    const handleSku = (values: any, dataType: string) => {
        if (dataType.includes("plan")) {
            values["sku"] = values["skuPlans"];
        }
        return values;
    };

    // Function to fetch itemId for 'inventory-plan' data type
    const fetchItemId = async (values: any, currentLocationId: string, dataType: string) => {
        return dataType === "inventory-plan" ? await getItemId(values["skuPlans"], currentLocationId) : undefined;
    };

    // Function to validate dates
    const validateDataDates = (
        values: any,
        dataType: string,
        setModalError: React.Dispatch<React.SetStateAction<boolean>>,
        setModalErrorMsg: React.Dispatch<React.SetStateAction<string>>
    ) => {
        const firstDatesKey = dataType === "inventory-plan" ? "startDate" : "shipDate";
        const secondDatesKey = dataType === "inventory-plan" ? "endDate" : "arrivalDate";
        return dataType === "inventory-plan" || dataType === "transfer-plan"
            ? validateDates(values[firstDatesKey], values[secondDatesKey], setModalError, setModalErrorMsg)
            : true;
    };

    // Function to validate turnover hour
    const validateTurnoverHour = (values: any, dataType: string) => {
        return dataType === "inventory-plan" ? values["turnoverHour"] > 0 && values["turnoverHour"] <= 24 : true;
    };

    // Function to validate lead time
    const validateLeadTime = (values: any, dataType: string) => {
        return dataType === "downstream" || dataType === "upstream" ? values["leadTime"] > 0 : true;
    };

    // Function to handle Location updates
    const handleLocationUpdates = async (
        row: any,
        values: any,
        customColumns: any,
        setModalError: Function,
        setModalErrorMsg: Function
    ) => {
        const rowData = row.original as any;
        const locationId: string = rowData["id"];
        const updatedLocation: Location = {
            description: trimAllWhiteSpaces(values["location"]),
            type: values["type"],
            userDefinedFields: setCustomFields(customColumns, values),
            id: locationId
        };
        try {
            await updateLocation(updatedLocation).unwrap();
            return true;
        } catch (error: any) {
            setModalError(true);
            if (error && error.data) {
                setModalErrorMsg(error.data.message);
            }
            return false;
        }
    };

    // Function to update table items
    const updateTableItemsWrapper = async (
        values: any,
        dataType: string,
        customColumns: any,
        currentLocationItem: locationItem,
        row: any,
        setModalErrorMsg: React.Dispatch<React.SetStateAction<string>>,
        setErrorType: React.Dispatch<React.SetStateAction<string>> | undefined
    ) => {
        return await updateTableItems(
            values,
            dataType,
            customColumns,
            currentLocationItem,
            row.original,
            setModalErrorMsg,
            setErrorType
        );
    };

    // Function to handle table data
    const handleSaveRowEdits: MaterialReactTableProps["onEditingRowSave"] = async ({
        exitEditingMode,
        row,
        values
    }) => {
        if (!Object.keys(validationErrors).length) {
            values = handleSku(values, dataType);
            const itemId = await fetchItemId(values, currentLocationId, dataType);
            tableData[row.index] = values;

            const datesValidated = validateDataDates(values, dataType, setModalError, setModalErrorMsg);
            const turnoverHourSuccess = validateTurnoverHour(values, dataType);
            const leadTimeSuccess = validateLeadTime(values, dataType);

            if (datesValidated && turnoverHourSuccess && leadTimeSuccess) {
                if (dataType === VertexLabel.LOCATION) {
                    await handleLocationUpdates(row, values, customColumns, setModalError, setModalErrorMsg);
                } else {
                    await updateTableItemsWrapper(
                        values,
                        dataType,
                        customColumns,
                        { itemId: itemId, locationId: currentLocationId },
                        row,
                        setModalErrorMsg,
                        setErrorType
                    );
                }
            } else {
                setModalError(false);
                setModalErrorMsg("");
            }

            populateTableDistributer(
                setTableData,
                dataType,
                customColumns,
                setDropdown,
                setSkuList,
                currentLocationId,
                {
                    setNodes,
                    setEdges
                }
            );
            exitEditingMode(); //required to exit editing mode and close modal
        }
    };

    const handleCancelRowEdits = () => {
        setValidationErrors({});
    };

    const handleDeleteRow = useCallback(async (row: MRT_Row) => {
        const deleteItemsPointers: any = {
            item: "sku",
            location: "location",
            "inventory-plan": "sku",
            "transfer-plan": "sku",
            upstream: "upstream",
            downstream: "downstream"
        };
        const rowContent: any = row.original;
        const keyPointerItem: any = deleteItemsPointers[dataType];
        const pointerItem: any = rowContent[keyPointerItem];
        if (dataType === "transfer-plan" && rowContent["status"] === "in-transit") {
            window.alert("Delete an in-transit transfer plan is not allowed.");
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${pointerItem}?`)) {
            return;
        }
        if (dataType === VertexLabel.LOCATION) {
            const locationToBeDeleted: Location = {
                description: rowContent.description,
                type: rowContent.type,
                id: rowContent.id
            };
            await deleteLocation(locationToBeDeleted);
            return true;
        } else {
            await deleteTableItems(row.original, dataType, currentLocationId, mapLocationID);
            populateTableDistributer(
                setTableData,
                dataType,
                customColumns,
                setDropdown,
                setSkuList,
                currentLocationId,
                {
                    setNodes,
                    setEdges
                }
            );
        }
    }, []);

    const columns = useMemo<MRT_ColumnDef[]>(() => {
        switch (dataType) {
            case "item":
                return inventoryColumnDef;
            case "location":
                return locationColumnDef;
            case "downstream":
                return downstreamColumnDef;
            case "upstream":
                return upstreamColumnDef;
            case "transfer-plan":
                return transferPlansColumnDef;
            case "inventory-plan":
                return inventoryPlansColumnDef;
            default:
                return [];
        }
    }, [dataType]);

    const renderTextFieldProps = (fieldType: AllowedTypes) => {
        switch (fieldType) {
            case AllowedTypes.TEXT:
                return {
                    type: "text"
                };
            case AllowedTypes.DATE:
                return {
                    type: "date",
                    InputLabelProps: {
                        shrink: true
                    }
                };
            case AllowedTypes.NUMBER:
                return {
                    type: "number"
                };
            default: // NOSONAR: typescript:S1871 It's ok to have same return in default as above
                return {
                    type: "text"
                };
        }
    };

    const renderCustomColumns = customColumns.map(column => {
        return {
            accessorKey: Case.camel(column.fieldName),
            header: column.fieldName,
            muiTableBodyCellEditTextFieldProps: renderTextFieldProps(column.fieldType)
        };
    }) as MRT_ColumnDef[];

    const renderBottomToolbarCustomActions = () => {
        if (dataType === "item" || dataType == "location") {
            return (
                <Grid gridDefinition={[{ offset: { s: 2 } }, { offset: { s: 2 } }]}>
                    <Button onClick={() => setCreateModalOpen(true)}> Add New {dataType}</Button>
                    <Button onClick={() => setCustomModalOpen(true)}> Customize Fields</Button>
                </Grid>
            );
        } else {
            return (
                <Grid gridDefinition={[{ offset: { s: 2 } }, { offset: { s: 2 } }]}>
                    <Button onClick={() => setCreateModalOpen(true)}> Add New {dataType}</Button>
                </Grid>
            );
        }
    };

    return (
        <>
            <MaterialReactTable
                columns={[...columns, ...renderCustomColumns]}
                data={tableData}
                editingMode="modal" //default
                enableColumnOrdering
                enableEditing
                muiTableContainerProps={{ sx: { maxHeight: "350px" } }}
                state={{ isLoading: loading }}
                enablePagination={false}
                enableTopToolbar={false}
                onEditingRowSave={handleSaveRowEdits}
                onEditingRowCancel={handleCancelRowEdits}
                renderRowActions={({ row, table }) => (
                    <div className="row-action">
                        {enableEditing && (
                            <Tooltip arrow placement="left" title="Edit">
                                <IconButton onClick={() => table.setEditingRow(row)} aria-label="edit">
                                    <CloudScapeIcon iconName={IconName.EDIT} />
                                </IconButton>
                            </Tooltip>
                        )}
                        <Tooltip arrow placement="right" title="Delete">
                            <IconButton color="error" onClick={() => handleDeleteRow(row)}>
                                <CloudScapeIcon iconName={IconName.REMOVE} />
                            </IconButton>
                        </Tooltip>
                    </div>
                )}
                renderBottomToolbarCustomActions={renderBottomToolbarCustomActions}
            />
            <CreateNewAccountModal
                columns={columns}
                customFields={customColumns}
                open={createModalOpen}
                onClose={onCreateModalClose}
                onSubmit={handleCreateSubmit}
                dataType={dataType}
                skuList={skuList}
                locationList={locationList}
                locationId={currentLocationId}
                currentLocation={currentLocation}
                validateDates={validateDates}
                dateFieldError={dateFieldError}
                formError={formError}
                formErrorMsg={modalErrorMsg}
                selectedLocation={selectedLocation}
                errorType={errorType}
            />
            <CustomizeFieldModal
                customFields={customColumns}
                open={customModalOpen}
                onClose={onCustomModalClose}
                onSubmit={handleCustomSubmit}
                validateDates={validateDates}
                formError={formError}
            />
        </>
    );
};
export default CRUDTable;
