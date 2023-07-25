// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Grid from "@cloudscape-design/components/grid";
import { Outlet } from "react-router-dom";

/**
 *
 */
export default function Content() {
    return (
        <>
            <Grid gridDefinition={[{ colspan: 12 }]}>
                <Outlet />
            </Grid>
        </>
    );
}
