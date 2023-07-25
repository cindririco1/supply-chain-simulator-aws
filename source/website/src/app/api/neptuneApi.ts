// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { generateToken, getRuntimeConfig } from "../../utils/apiHelper";

export const dynamicBaseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
    args,
    api,
    extraOptions
) => {
    const runtimeConfig = await getRuntimeConfig();
    const rawBaseQuery = fetchBaseQuery({
        baseUrl: runtimeConfig.API_ENDPOINT,
        prepareHeaders: async headers => {
            const token = await generateToken();
            headers.set("authorization", `Bearer ${token}`);
            return headers;
        }
    });
    return rawBaseQuery(args, api, extraOptions);
};
export const neptuneApi = createApi({
    reducerPath: "neptuneApi",
    baseQuery: dynamicBaseQuery,
    tagTypes: ["Location"],
    endpoints: () => ({})
});
