// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AppLayout } from "@cloudscape-design/components";
import Breadcrumbs from "./components/breadcrumbs";
import SavantContentLayout from "./components/savantContentLayout";
import SideNavBar from "./components/sideNavBar";

/**
 *
 */
export default function Layout() {
    return (
        <>
            <AppLayout
                content={<SavantContentLayout />}
                toolsHide={true}
                breadcrumbs={<Breadcrumbs />}
                headerSelector="#header"
                navigation={<SideNavBar />}
            />
        </>
    );
}
