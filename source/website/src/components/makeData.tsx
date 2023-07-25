// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Item } from "neptune/model/item";
import { InventoryPlan } from "neptune/model/inventory-plan";
import { TransferPlan } from "neptune/model/transfer-plan";
import { Vertex } from "neptune/model/vertex";
import { LocationType } from "../constants";

export interface OptionProps {
    value: string;
    label: string;
}
export interface TransferPlans extends TransferPlan {
    sku?: string;
    fromLocation?: string;
    toLocation?: string;
}

export interface Locations extends Vertex {
    location?: string;
    type?: LocationType;
    userDefinedFields?: string;
}

export interface Downstream extends Vertex {
    downstream?: string;
}

export interface Upstream extends Vertex {
    upstream?: string;
}

export const location: Locations[] = [];

export const inventory: Item[] = [];

export const inventoryPlans: InventoryPlan[] = [];

export const transferPlans: TransferPlans[] = [];

export const downstream: Downstream[] = [];

export const upstream: Upstream[] = [];

export const locationColumnDef = [
    {
        accessorKey: "location",
        header: "Location",
        size: 80
    },
    {
        // id: "locationType",
        accessorKey: "type",
        header: "Location Type",
        size: 140,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                disabled: true
            };
        }
    }
];

export const inventoryColumnDef = [
    {
        accessorKey: "sku",
        header: "SKU",
        size: 80,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                disabled: true
            };
        }
    },
    {
        accessorKey: "amount",
        header: "Amount",
        size: 140,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                type: "number"
            };
        }
    }
];

export const transferPlansColumnDef = [
    {
        id: "skuPlans",
        accessorKey: "sku",
        header: "SKU",
        size: 80,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                disabled: true
            };
        }
    },
    {
        accessorKey: "fromLocation",
        header: "From Location",
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                disabled: true
            };
        }
    },
    {
        accessorKey: "toLocation",
        header: "To Location",
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                disabled: true
            };
        }
    },
    {
        accessorKey: "shipDate",
        header: "Ship Date",
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                type: "date"
            };
        }
    },
    {
        accessorKey: "arrivalDate",
        header: "Arrival Date",
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                type: "date"
            };
        }
    },
    {
        accessorKey: "transferAmount",
        header: "Transfer Amount",
        size: 140,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                type: "number"
            };
        }
    }
];

export const inventoryPlansColumnDef = [
    {
        id: "skuPlans",
        accessorKey: "sku",
        header: "SKU",
        size: 80,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                disabled: true
            };
        }
    },
    {
        accessorKey: "date",
        header: "Date",
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                type: "date"
            };
        }
    },
    {
        accessorKey: "turnoverHour",
        header: "Turnover Hour",
        size: 140,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                type: "number"
            };
        }
    },
    {
        accessorKey: "planType",
        header: "Plan Type",
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                disabled: true
            };
        }
    },
    {
        accessorKey: "dailyRate",
        header: "Quantity",
        size: 140,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                type: "number"
            };
        }
    }
];

export const downstreamColumnDef = [
    {
        accessorKey: "downstream",
        header: "Downstream",
        size: 140,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                disabled: true
            };
        }
    },
    {
        accessorKey: "leadTime",
        header: "Lead Time",
        size: 140,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                type: "number"
            };
        }
    }
];

export const upstreamColumnDef = [
    {
        accessorKey: "upstream",
        header: "Upstream",
        size: 80,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                disabled: true
            };
        }
    },
    {
        accessorKey: "leadTime",
        header: "Lead Time",
        size: 140,
        muiTableBodyCellEditTextFieldProps: () => {
            return {
                type: "number"
            };
        }
    }
];
