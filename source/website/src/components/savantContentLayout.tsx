// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import ContentLayout from "@cloudscape-design/components/content-layout";
import Content from "./content";
import DashboardHeader from "./dashboardHeader";
/**
 *
 */
export default function SavantContentLayout() {
    return (
        <>
            <ContentLayout disableOverlap header={<DashboardHeader />}>
                <Content />
            </ContentLayout>
        </>
    );
}
