// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FC, useEffect, useState } from "react";
import Button from "@cloudscape-design/components/button";
import {
    Dialog,
    DialogActions,
    DialogContent,
    Stack,
    MenuItem,
    TextField,
    DialogTitle,
    Tooltip,
    IconButton
} from "@mui/material";
import Grid from "@cloudscape-design/components/grid";
import { Delete } from "@mui/icons-material";

interface Props {
    customFields: CustomColumnDef[];
    onClose: () => void;
    onSubmit: (columns: CustomColumnDef[], deletedColumns: CustomColumnDef[]) => void;
    open: boolean;
    validateDates: (a: string, b: string, c?: any, d?: any) => boolean;
    formError: boolean;
}

export enum AllowedTypes {
    TEXT = "text",
    NUMBER = "number",
    DATE = "date"
}

export interface CustomColumnDef {
    fieldName: string;
    fieldType: AllowedTypes;
    disabled?: boolean;
}

export interface CustomField {
    fieldName: string;
    fieldType: AllowedTypes;
}

export interface CustomFieldChangeRequest {
    customFields: {
        new: CustomField[];
        delete: CustomField[];
    };
}

export const CustomizeFieldModal: FC<Props> = ({ open, customFields, onClose, onSubmit, formError }) => {
    const defaultColumnDef = {
        fieldName: "",
        fieldType: AllowedTypes.TEXT,
        disabled: false
    };

    const lockDownFields = (customFields: CustomColumnDef[]) => {
        return customFields.forEach(customField => (customField.disabled = true));
    };

    // Lock down edit mode for custom fields fetched from Neptune DB
    lockDownFields(customFields);
    const [columnDefs, setColumnDefs] = useState<CustomColumnDef[]>(customFields);
    const [columnsDefsToDelete, setColumnDefsToDelete] = useState<CustomColumnDef[]>([]);
    const [columnDefsToAdd, setColumnDefsToAdd] = useState<CustomColumnDef[]>([]);

    useEffect(() => {
        setColumnDefs(customFields);
    }, [customFields]);
    const getActiveTypes = () => {
        return Object.values(AllowedTypes);
    };

    const updateFieldName = (i: number, value: string) => {
        const columns = columnDefs;
        columns[i].fieldName = value;
        setColumnDefs(columns);
    };

    const updateFieldType = (i: number, value: string) => {
        const columns = columnDefs;
        columns[i].fieldType = value as AllowedTypes;
        setColumnDefs(columns);
    };

    // Validate if current form is valid
    const isFormValid = (columns: CustomColumnDef[]) => {
        for (const column of columns) {
            if (column.fieldName === "") {
                return false;
            }
        }
        return true;
    };

    const addField = () => {
        // Check if current form is valid before allowing customer to create a new field
        if (isFormValid(columnDefs)) {
            setColumnDefs([...columnDefs, defaultColumnDef]);
            setColumnDefsToAdd([...columnDefsToAdd, defaultColumnDef]);
        } else {
            window.alert("Please fill out the fields");
        }
    };

    const removeField = (column: CustomColumnDef) => {
        setColumnDefsToDelete([...columnsDefsToDelete, column]);
        const columns = columnDefs.filter(c => c.fieldName !== column.fieldName);
        setColumnDefs(columns);
    };

    const renderFields = (columns: CustomColumnDef[]) => {
        const content = [];
        // Leverages index of current column to track which column to update while onChange is triggered
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            content.push(
                <Grid
                    gridDefinition={[{ colspan: 5 }, { colspan: 5 }, { colspan: 2 }]}
                    key={`${column.fieldName}-${i}`}>
                    <TextField
                        sx={{ width: "100%" }}
                        disabled={column.disabled}
                        required={true}
                        select={false}
                        label={"Name"}
                        name={"fieldName"}
                        defaultValue={columnDefs[i].fieldName}
                        type={"text"}
                        error={formError}
                        helperText={formError}
                        onChange={e => updateFieldName(i, e.target.value)}></TextField>
                    <TextField
                        sx={{ width: "100%" }}
                        disabled={column.disabled}
                        required={true}
                        select={true}
                        label={"Type"}
                        name={"fieldType"}
                        defaultValue={columnDefs[i].fieldType}
                        error={formError}
                        helperText={formError}
                        onChange={e => updateFieldType(i, e.target.value)}>
                        {getActiveTypes().map(type => (
                            <MenuItem key={type} value={type}>
                                {type}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Tooltip sx={{ width: "100%" }} arrow placement="right" title="Delete">
                        <IconButton
                            onClick={() => {
                                removeField(column);
                            }}>
                            <Delete />
                        </IconButton>
                    </Tooltip>
                </Grid>
            );
        }
        return content;
    };

    return (
        <Dialog open={open}>
            <DialogTitle textAlign="center">Customize Fields</DialogTitle>
            <DialogContent>
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        onSubmit(columnDefsToAdd, columnsDefsToDelete);
                        lockDownFields(columnDefs);
                        setColumnDefs(columnDefs); // NOSONAR: typescript:S6443
                        setColumnDefsToAdd([]);
                        setColumnDefsToDelete([]);
                    }}>
                    <Stack
                        sx={{
                            width: "100%",
                            minWidth: { xs: "300px", sm: "360px", md: "400px" },
                            gap: "1.5rem",
                            p: 1
                        }}>
                        {renderFields(columnDefs)}
                        <Grid>
                            <Button
                                onClick={() => {
                                    addField();
                                }}>
                                Add New Field
                            </Button>
                        </Grid>
                        {
                            <DialogActions>
                                <Button
                                    onClick={e => {
                                        e.preventDefault();
                                        setColumnDefs(customFields);
                                        setColumnDefsToAdd([]);
                                        setColumnDefsToDelete([]);
                                        onClose();
                                    }}>
                                    Cancel
                                </Button>
                                <Button formAction="submit"> Save </Button>
                            </DialogActions>
                        }
                    </Stack>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default CustomizeFieldModal;
