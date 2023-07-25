// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { EntityState, createEntityAdapter, createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Location } from "neptune/model/location";
import { LocationResponse } from "../../models/response/locationResponse";
import { neptuneApi } from "../api/neptuneApi";
import { RootState } from "./rootReducer";

/*
 * Location Slice / Reducer for state management
 */
interface LocationState {
    locationId: string;
    modalError: boolean;
}

const locationReducerInitialState: LocationState = {
    locationId: "",
    modalError: false
};
export const locationSlice = createSlice({
    name: "location",
    initialState: locationReducerInitialState,
    reducers: {
        setLocationId: (state: LocationState, action: PayloadAction<string>) => {
            state.locationId = action.payload;
        },
        setModalError: (state: LocationState, action: PayloadAction<boolean>) => {
            state.modalError = action.payload;
        }
    }
});

export const { setLocationId, setModalError } = locationSlice.actions;
export const selectLocationId = (state: RootState) => state.location.locationId;
export const selectLocationModalError = (state: RootState) => state.location.modalError;
/*
 * Api Slice for Location calls
 */
const locationAdapter = createEntityAdapter<Location>();
const locationApiInitialState = locationAdapter.getInitialState();

export const locationApiSlice = neptuneApi.injectEndpoints({
    endpoints: builder => ({
        getLocations: builder.query<EntityState<Location>, void>({
            query: () => "location",
            transformResponse: (response: LocationResponse) => {
                return locationAdapter.setAll(locationApiInitialState, response.locations);
            },
            providesTags: ["Location"]
        }),
        postLocation: builder.mutation<EntityState<Location>, Location>({
            query: (location: Location) => ({
                url: "location",
                method: "POST",
                body: location
            }),
            invalidatesTags: ["Location"]
        }),
        putLocation: builder.mutation<EntityState<Location>, Location>({
            query: (location: Location) => ({
                url: "location",
                method: "PUT",
                body: location
            }),
            invalidatesTags: ["Location"]
        }),
        deleteLocation: builder.mutation<EntityState<Location>, Location>({
            query: (location: Location) => ({
                url: "location",
                method: "DELETE",
                body: location
            }),
            invalidatesTags: ["Location"]
        })
    })
});

export const { useGetLocationsQuery, usePostLocationMutation, usePutLocationMutation, useDeleteLocationMutation } =
    locationApiSlice;

export const selectLocationsResult = locationApiSlice.endpoints.getLocations.select();
const selectLocationsData = createSelector(selectLocationsResult, (locationsResult: any) => locationsResult?.data);

export const { selectAll: selectAllLocations } = locationAdapter.getSelectors(
    (state: RootState) => selectLocationsData(state) ?? locationApiInitialState
);
