// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Auth } from "aws-amplify";

import "@aws-amplify/ui-react/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "@cloudscape-design/components/button";
import { Header } from "@cloudscape-design/components";
import { useAppSelector } from "../app/hooks/hooks";
import { selectPath } from "../app/reducers/routeSlice";
import { useEffect, useState } from "react";
import { createLabel } from "../utils/stringHelper";

/**
 *
 */
export async function signOut() {
    await Auth.signOut();
}

/**
 *
 */
export default function DashboardHeader() {
    const path = useAppSelector(selectPath);
    const baseTitle = "Dashboard";
    const [title, setTitle] = useState(baseTitle);
    useEffect(() => {
        const trimmedPath = path.replace("/", "");
        if (trimmedPath.length > 0) {
            const label = createLabel(trimmedPath);
            setTitle(createLabel(label));
        } else {
            setTitle(baseTitle);
        }
    }, [path, title]);
    return (
        <>
            <Header variant="h1" actions={<Button onClick={signOut}>Sign out</Button>}>
                {title}
            </Header>
        </>
    );
}
