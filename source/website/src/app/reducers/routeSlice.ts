// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BreadcrumbGroupProps } from "@cloudscape-design/components";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./rootReducer";

interface RouteState {
    path: string;
    breadcrumbs: BreadcrumbGroupProps.Item[];
}

export const baseBreadcrumbs: BreadcrumbGroupProps.Item = {
    text: "Supply Chain Simulator on AWS",
    href: "/"
};

const initialRouteState: RouteState = {
    path: `/`,
    breadcrumbs: [baseBreadcrumbs]
};

export const routeSlice = createSlice({
    name: "route",
    initialState: initialRouteState,
    reducers: {
        setPath: (state: RouteState, action: PayloadAction<string>) => {
            state.path = action.payload;
        },
        setBreadCrumbs: (state: RouteState, action: PayloadAction<BreadcrumbGroupProps.Item[]>) => {
            state.breadcrumbs = action.payload;
        }
    }
});

export const { setPath, setBreadCrumbs } = routeSlice.actions;

export const selectPath = (state: RootState) => state.route.path;
export const selectBreadcrumbs = (state: RootState) => state.route.breadcrumbs;
