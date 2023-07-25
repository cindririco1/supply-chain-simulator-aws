// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FC, useMemo } from "react";
import MaterialReactTable, { MRT_ColumnDef } from "material-react-table";

interface Props {
    numDays: number;
    itemId: string;
    projections: Record<string, any>[];
}

/* eslint-disable @typescript-eslint/no-unused-vars */
const DaysTable: FC<Props> = ({ numDays, itemId, projections }) => {
    const accessor_columns = [{ accessorKey: "projectionType", header: "Type" }];
    for (let i = 1; i <= numDays; i++) {
        accessor_columns.push({
            accessorKey: `day${i}`,
            header: `Day ${i}`
        });
    }

    const columns = useMemo<MRT_ColumnDef[]>(() => accessor_columns, []);
    return <MaterialReactTable columns={columns} data={projections} />;
};

export default DaysTable;
