// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./layout";

import { withAuthenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useAppDispatch } from "./app/hooks/hooks";
import { locationApiSlice } from "./app/reducers/locationSlice";
import { RoutePath } from "./models/enums/routePath";
import ViewTabs from "./routes/tabs";

/**
 * Main app component
 */
export function App() {
    const dispatch = useAppDispatch();
    dispatch(locationApiSlice.endpoints.getLocations.initiate());
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<ViewTabs />} />
                    <Route path={RoutePath.DASHBOARD} element={<ViewTabs />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default withAuthenticator(App, {
    loginMechanisms: ["email"],
    hideSignUp: true
});
