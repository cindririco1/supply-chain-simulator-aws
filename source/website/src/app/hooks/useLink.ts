// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BreadcrumbGroupProps } from "@cloudscape-design/components";
import { useCallback } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import { createLabel } from "../../utils/stringHelper";
import { baseBreadcrumbs, setBreadCrumbs, setPath } from "../reducers/routeSlice";
import { useAppDispatch } from "./hooks";

export interface State {
    readonly handleFollow: (event: Readonly<CustomEvent>) => void;
}

const createBreadcrumb = (path: string): BreadcrumbGroupProps.Item => {
    const trimmedPath = path.replace("/", "");
    return {
        href: path,
        text: createLabel(trimmedPath)
    };
};
const createBreadcrumbs = (path: string): BreadcrumbGroupProps.Item[] => {
    const breadcrumbItems: BreadcrumbGroupProps.Item[] = [baseBreadcrumbs];
    const trimmedPath = path.replace("/", "");

    if (trimmedPath.length > 0) {
        breadcrumbItems.push(createBreadcrumb(path));
    }
    return breadcrumbItems;
};

/**
 *
 */
export default function useLink(): State {
    const dispatch = useAppDispatch();
    const navigate: NavigateFunction = useNavigate();

    return {
        handleFollow: useCallback(
            (e: Readonly<CustomEvent>): void => {
                if (e.detail.external === true || typeof e.detail.href === undefined) {
                    return;
                }
                const path = e.detail.href;
                e.preventDefault();
                dispatch(setPath(path));
                dispatch(setBreadCrumbs(createBreadcrumbs(path)));
                navigate(path);
            },
            [navigate]
        )
    };
}
