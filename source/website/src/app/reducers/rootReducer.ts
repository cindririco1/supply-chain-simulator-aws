// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { combineReducers } from "@reduxjs/toolkit";
import { neptuneApi } from "../api/neptuneApi";
import { locationSlice } from "./locationSlice";
import { routeSlice } from "./routeSlice";
const rootReducer = combineReducers({
    [neptuneApi.reducerPath]: neptuneApi.reducer,
    [locationSlice.name]: locationSlice.reducer,
    [routeSlice.name]: routeSlice.reducer
});
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
