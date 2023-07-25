// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Button from "@cloudscape-design/components/button";
import { Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { MRT_ColumnDef } from "material-react-table";
import React, { BaseSyntheticEvent, FC, useCallback, useEffect, useState } from "react";
import { InventoryPlanType, LocationType } from "../constants";
import { Location } from "neptune/model/location";

import * as Case from "case";
import { AllowedTypes, CustomColumnDef } from "./customize-field-modal";
import { getItemId, getTransfers } from "./shared";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);
interface Props {
    columns: MRT_ColumnDef[];
    customFields: CustomColumnDef[];
    onClose: () => void;
    onSubmit: (values: any, b: any, c: any, d: any, e: any, f: any) => void;
    open: boolean;
    dataType: string;
    skuList?: any[];
    locationList: any[];
    locationId: string;
    currentLocation: string;
    validateDates: (a: string, b: string, c?: any, d?: any) => boolean;
    dateFieldError: boolean;
    formError: boolean;
    formErrorMsg: string;
    selectedLocation?: Location;
    errorType?: string;
}

export const CreateNewAccountModal: FC<Props> = ({
    open,
    columns,
    customFields,
    onClose,
    onSubmit,
    dataType,
    skuList,
    locationList,
    locationId,
    currentLocation,
    dateFieldError,
    formError,
    formErrorMsg,
    selectedLocation,
    errorType
}) => {
    const [values, setValues] = useState<any>(() =>
        columns.reduce((acc, column) => {
            acc[column.accessorKey ?? ""] = "";
            return acc;
        }, {} as any)
    );

    const [turnoverHourFieldError, setTurnoverHourFieldError] = useState<boolean>(false);
    const [dailyRateFieldError, setDailyRateFieldError] = useState<boolean>(false); // NOSONAR: typescript:S1854
    const [leadTimeError, setLeadTimeError] = useState<boolean>(false);
    const [dateFieldMsg, setDateFieldMsg] = useState<string>("");
    const [itemId, setItemId] = useState<string>("");
    const [transfers, setTransfers] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        const fetchData = async () => {
            const data = await getTransfers(locationId);
            setTransfers(data);
        };
        fetchData();
    }, []);

    const getInputLabelProps = (accessorKey: string | undefined) => {
        switch (accessorKey) {
            case "planType":
            case "date":
            case "arrivalDate":
            case "shipDate":
                return { shrink: true };
            default:
                return {};
        }
    };

    const getCustomFieldInputLabelProps = (props: AllowedTypes | undefined) => {
        if (props && props === AllowedTypes.DATE) {
            return { shrink: true };
        } else {
            return {};
        }
    };

    const getDisabled = (accessorKey: string | undefined) => {
        switch (accessorKey) {
            case "fromLocation":
                return true;
            case "arrivalDate":
                return true;
            default:
                return false;
        }
    };

    const getValue = (accessorKey: string | undefined) => {
        switch (accessorKey) {
            case "fromLocation":
                return currentLocation;
            case "arrivalDate": {
                if (values.shipDate && values.toLocation) {
                    return dayjs(values.shipDate).add(transfers.get(values.toLocation)!, "day").format("YYYY-MM-DD");
                } else {
                    return undefined;
                }
            }
            default:
                return undefined;
        }
    };

    const getType = (accessorKey: string | undefined) => {
        switch (accessorKey) {
            case "date":
            case "arrivalDate":
            case "shipDate":
                return "date";
            case "amount":
            case "transferAmount":
            case "turnoverHour":
            case "dailyRate":
                return "number";
            default:
                return "text";
        }
    };

    const getTypeForCustomField = (fieldType: string | undefined) => {
        switch (fieldType) {
            case AllowedTypes.TEXT:
                return "text";
            case AllowedTypes.DATE:
                return "date";
            case AllowedTypes.NUMBER:
                return "number";
            default:
                return "text";
        }
    };

    const getActiveTypes = (accessorKey: string | undefined, id: string | undefined) => {
        if (id === "skuPlans" && skuList) return skuList;

        switch (accessorKey) {
            case "type":
                return Object.values(LocationType);
            case "planType": {
                const isManufacturer = selectedLocation && selectedLocation?.type === LocationType.MANUFACTURER;
                const inventoryPlan = isManufacturer ? InventoryPlanType.MANUFACTURING : InventoryPlanType.SALES;
                return [inventoryPlan];
            }
            case "downstream":
            case "upstream":
            case "toLocation":
                return locationList;
            default:
                return [];
        }
    };

    const getSelectType = (accessorKey: string | undefined, id: string | undefined) => {
        if (id === "skuPlans") return true;

        switch (accessorKey) {
            case "type":
                return true;
            case "planType":
                return true;
            case "toLocation":
                return true;
            case "downstream":
                return true;
            case "upstream":
                return true;
            default:
                return false;
        }
    };

    const getErrorFlag = (accessorKey: string | undefined, id: string | undefined) => {
        if (id === "skuPlans") return false;
        switch (accessorKey) {
            case "downstream":
            case "upstream":
            case "toLocation":
            case "location":
            case "sku":
                return errorType && errorType === "sku" ? formError : false;
            case "date":
            case "arrivalDate":
            case "shipDate":
                return open && dateFieldError;
            case "turnoverHour":
                return turnoverHourFieldError;
            case "dailyRate":
                return formError;
            case "leadTime":
                return leadTimeError;
            case "transferAmount":
                return errorType && errorType === "transferAmount" && formError ? formError : false;
            default:
                return false;
        }
    };

    const getErrorHelperText = (accessorKey: string | undefined, id: string | undefined) => {
        if (id === "skuPlans") return false;
        switch (accessorKey) {
            case "downstream":
            case "upstream":
            case "toLocation":
            case "location":
            case "sku":
                return errorType && errorType === "sku" && formError ? formErrorMsg : "";
            case "date":
            case "arrivalDate":
            case "shipDate":
                return dateFieldError ? dateFieldMsg : "";
            case "turnoverHour":
                return getTurnoverFieldErrorIfFound(turnoverHourFieldError);
            case "dailyRate":
                return formError ? "Quantity should be greater than 0" : "";
            case "leadTime":
                return leadTimeError ? "Lead Time should be greater than 0" : "";
            case "transferAmount":
                return errorType && errorType === "transferAmount" && formError
                    ? "Transfer Amount should be greater than 0"
                    : "";
            default:
                return "";
        }
    };

    const getTurnoverFieldErrorIfFound = (turnoverHourFieldError: boolean) => {
        if (turnoverHourFieldError) {
            return "Turnover hour should be 0-23 (0 is 12am, 23 is 11pm)";
        }
        return "";
    };

    const handleSetValues = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.target.name === "toLocation" && values.shipDate) {
            const arrivalDate = dayjs(values.shipDate).add(transfers.get(e.target.value)!, "day").format("YYYY-MM-DD");
            setValues({ ...values, [e.target.name]: e.target.value, ["arrivalDate"]: arrivalDate });
        } else if (e.target.name === "shipDate" && values.toLocation) {
            const arrivalDate = dayjs(e.target.value)
                .add(transfers.get(values.toLocation)!, "day")
                .format("YYYY-MM-DD");
            setValues({ ...values, [e.target.name]: e.target.value, ["arrivalDate"]: arrivalDate });
        } else {
            setValues({ ...values, [e.target.name]: e.target.value });
        }
    };

    const selectItemId = useCallback(async (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const id = await getItemId(e.target.value, locationId);
        setItemId(id);
    }, []);

    const onSubmitValues = (e: BaseSyntheticEvent) => {
        e.preventDefault();
        onSubmit(values, setTurnoverHourFieldError, setLeadTimeError, setDateFieldMsg, setDailyRateFieldError, itemId);
    };

    const getMinDate = (dataType: string) => {
        if (dataType !== "date") {
            return undefined;
        }
        const date = dayjs().add(1, "day");
        return date.format("YYYY-MM-DD");
    };
    return (
        <Dialog open={open}>
            <DialogTitle textAlign="center">Add new {dataType}</DialogTitle>
            <DialogContent>
                <form onSubmit={onSubmitValues}>
                    <Stack
                        sx={{
                            width: "100%",
                            minWidth: { xs: "300px", sm: "360px", md: "400px" },
                            gap: "1.5rem",
                            p: 1
                        }}>
                        {columns.map(column => {
                            return (
                                <TextField
                                    inputProps={{
                                        min: getMinDate(getType(column.accessorKey))
                                    }}
                                    required={true}
                                    select={getSelectType(column.accessorKey, column.id)}
                                    key={column.accessorKey}
                                    label={column.header}
                                    name={column.accessorKey}
                                    InputLabelProps={getInputLabelProps(column.accessorKey)}
                                    disabled={getDisabled(column.accessorKey)}
                                    value={getValue(column.accessorKey)}
                                    type={getType(column.accessorKey)}
                                    error={getErrorFlag(column.accessorKey, column.id)}
                                    helperText={getErrorHelperText(column.accessorKey, column.id)}
                                    onChange={
                                        column.id === "skuPlans"
                                            ? e => {
                                                  setValues({ ...values, [e.target.name]: e.target.value });
                                                  selectItemId(e);
                                              }
                                            : e => handleSetValues(e)
                                    }>
                                    {column.accessorKey === "fromLocation"
                                        ? currentLocation
                                        : getActiveTypes(column.accessorKey, column.id).map(type => (
                                              <MenuItem key={type} value={type}>
                                                  {type}
                                              </MenuItem>
                                          ))}
                                </TextField>
                            );
                        })}
                        {customFields.map(customField => {
                            return (
                                <TextField
                                    required={false}
                                    key={Case.camel(customField.fieldName)}
                                    label={customField.fieldName}
                                    name={Case.camel(customField.fieldName)}
                                    InputLabelProps={getCustomFieldInputLabelProps(customField.fieldType)}
                                    type={getTypeForCustomField(customField.fieldType)}
                                    onChange={e =>
                                        setValues({ ...values, [e.target.name]: e.target.value })
                                    }></TextField>
                            );
                        })}
                        {
                            <DialogActions sx={{ p: "1.25rem" }}>
                                <Button
                                    onClick={e => {
                                        setValues({});
                                        e.preventDefault();
                                        onClose();
                                    }}>
                                    Cancel
                                </Button>
                                <Button formAction="submit">Create New {dataType}</Button>
                            </DialogActions>
                        }
                    </Stack>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CreateNewAccountModal;
