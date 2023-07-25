// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { configureStore, PreloadedState } from "@reduxjs/toolkit";
import { neptuneApi } from "./api/neptuneApi";
import rootReducer, { RootState } from "./reducers/rootReducer";

export const setupStore = (preloadedState?: PreloadedState<RootState>) => {
    return configureStore({
        reducer: rootReducer,
        middleware: getDefaultMiddleware => getDefaultMiddleware().concat(neptuneApi.middleware)
    });
};

// Inferred type: {}
export type AppStore = ReturnType<typeof setupStore>;
export type AppDispatch = AppStore["dispatch"];
