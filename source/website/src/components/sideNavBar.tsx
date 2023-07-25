// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SideNavigation, SideNavigationProps } from "@cloudscape-design/components";
import { useAppSelector } from "../app/hooks/hooks";
import useLink from "../app/hooks/useLink";
import { selectPath } from "../app/reducers/routeSlice";
import { RoutePath } from "../models/enums/routePath";
import { SideNavigationType } from "../models/enums/sideNavigationType";

/**
 *
 */
export default function SideNavBar() {
    const path = useAppSelector(selectPath);
    const navHeader: SideNavigationProps.Header = {
        href: "/",
        text: "Supply Chain Simulator on AWS"
    };
    const navItems: SideNavigationProps.Item[] = [
        {
            type: SideNavigationType.LINK,
            text: "Dashboard",
            href: `/${RoutePath.DASHBOARD}`
        }
    ];

    return (
        <>
            <SideNavigation items={navItems} header={navHeader} activeHref={path} onFollow={useLink().handleFollow} />
        </>
    );
}
