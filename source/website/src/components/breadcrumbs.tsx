// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BreadcrumbGroup } from "@cloudscape-design/components";
import { useEffect, useState } from "react";
import { useAppSelector } from "../app/hooks/hooks";
import { selectBreadcrumbs } from "../app/reducers/routeSlice";

/**
 *
 */
export default function Breadcrumbs() {
    const selectedBreadcrumbs = useAppSelector(selectBreadcrumbs);
    const [breadcrumbItems, setBreadcrumbsItems] = useState(selectedBreadcrumbs);

    useEffect(() => {
        setBreadcrumbsItems(selectedBreadcrumbs);
    }, [selectedBreadcrumbs]);
    return (
        <>
            <BreadcrumbGroup items={breadcrumbItems} expandAriaLabel="Show path" ariaLabel="Breadcrumbs" />
        </>
    );
}
