// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { InventoryPlan } from "neptune/model/inventory-plan";
import { Item } from "neptune/model/item";
import React, { useEffect, useState } from "react";
import { useEdgesState, useNodesState } from "reactflow";

import Alert from "@cloudscape-design/components/alert";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { Location } from "neptune/model/location";
import { useAppDispatch, useAppSelector } from "../app/hooks/hooks";
import { selectAllLocations, selectLocationId, setLocationId } from "../app/reducers/locationSlice";
import CRUDTable from "../components/crudTable";
import { CustomColumnDef } from "../components/customize-field-modal";
import DaysTable from "../components/daysTable";
import Dropdown from "../components/dropdown";
import InteractionFlow from "../components/interactionFlow";
import {
    downstream,
    Downstream,
    inventory,
    inventoryPlans,
    Locations,
    OptionProps,
    transferPlans,
    TransferPlans,
    upstream,
    Upstream
} from "../components/makeData";
import {
    getCustomColumns,
    getCustomFields,
    populateInventoryPlanTable,
    populateItemTable,
    populateProjectionsTable,
    populateTransferPlanTable,
    populateUpDownStreamTable
} from "../components/shared";
import { LocationType, VertexLabel } from "../constants";

/**
 * @returns {Box} - The tabs component
 */
export default function ViewTabs() {
    const dispatch = useAppDispatch();
    const locationId = useAppSelector(selectLocationId);
    const apiLocations = useAppSelector(selectAllLocations);
    const [itemCustomCols, setItemCustomCols] = useState<CustomColumnDef[]>([]);
    const [locationCustomCols, setLocationCustomCols] = useState<CustomColumnDef[]>([]);
    const [tabValue, setTabValue] = React.useState(0);
    const [locationData, setLocationData] = useState<Locations[]>([]);
    const [locationOptions, setLocationOptions] = useState<OptionProps[]>([]);
    const [upstreamData, setUpstreamData] = useState<Upstream[]>(() => upstream);
    const [downstreamData, setDownstreamData] = useState<Downstream[]>(() => downstream);
    const [inventoryData, setInventoryData] = useState<Item[]>(() => inventory);
    const [plansData, setPlansData] = useState<InventoryPlan[]>(() => inventoryPlans);
    const [transferPlansData, setTransferPlansData] = useState<TransferPlans[]>(() => transferPlans);

    const [items, setItems] = useState<OptionProps[]>([{ label: "", value: "" }]);
    const [modalError, setModalError] = useState<boolean>(false);
    const [locationModalError, setLocationModalError] = useState<boolean>(false);
    const [modalErrorMsg, setModalErrorMsg] = useState<string>("");
    const [errorType, setErrorType] = useState("");
    const [loading, setLoading] = useState<boolean>(true);
    const [tabsGenerate, setTabsGenerate] = useState<boolean>(false);
    const [itemId, setItemId] = useState<string>("");
    const [skuList, setSkuList] = useState<string[]>([]);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedLocation, setSelectedLocation] = useState<OptionProps>({ label: "", value: "" });
    const [projections, setProjections] = useState<Record<string, any>[]>([]);
    const [currentLocation, setCurrentLocation] = useState<Location | undefined>(undefined);

    const [loadingOnLocationSelect, setLoadingOnLocationSelect] = useState(false); // NOSONAR: typescript:S1854

    const tabChange = async function (event: React.SyntheticEvent, newValue: number) {
        setTabValue(newValue);
        switch (newValue) {
            case 0:
                await populateItemTable(itemCustomCols, setInventoryData, setSkuList, locationId, setItems);
                break;
            case 1:
                await populateInventoryPlanTable(setPlansData, locationId);
                break;
            case 2:
                await populateTransferPlanTable(setTransferPlansData, locationId);
                break;
            case 3:
                await populateUpDownStreamTable("downstream", setDownstreamData, locationId);
                break;
            case 4:
                await populateUpDownStreamTable("upstream", setUpstreamData, locationId);
                break;
        }
    };

    const onLocationSelect = async (selectedId: string) => {
        setLoadingOnLocationSelect(true);
        dispatch(setLocationId(selectedId));
        const selected = locationOptions.find((location: OptionProps) => location.value === selectedId);
        const currentLoc = apiLocations.find(loc => loc.id! === selectedId);
        const curNode = nodes.find(node => node.id === selectedLocation.value);
        if (curNode) {
            curNode.selected = false;
        }
        if (selected) {
            setSelectedLocation(selected);
        }

        if (currentLoc) {
            setCurrentLocation(currentLoc);
        }

        const newNode = nodes.find(node => node.id === selectedId);
        if (newNode) {
            newNode.selected = true;
            setNodes([...nodes, newNode]);
        }
        setTabsGenerate(true);
        setItemId("");
        await populateItemTable(itemCustomCols, setInventoryData, setSkuList, selectedId, setItems);
        await populateInventoryPlanTable(setPlansData, selectedId);
        await populateTransferPlanTable(setTransferPlansData, selectedId);
        await populateUpDownStreamTable("downstream", setDownstreamData, selectedId);
        await populateUpDownStreamTable("upstream", setUpstreamData, selectedId);
        setLoadingOnLocationSelect(false);
    };

    const onItemSelect = async (newValue: any) => {
        setItemId(newValue);
        populateProjectionsTable(setProjections, [], newValue);
    };

    useEffect(() => {
        setLocationData(
            apiLocations.map((loc: Location) => {
                const preMappedLocation = {
                    id: loc.id,
                    type: loc.type,
                    location: loc.description
                };
                const result = getCustomFields(locationCustomCols, preMappedLocation, loc);
                return result;
            })
        );
    }, [apiLocations, locationCustomCols]);

    useEffect(() => {
        setLocationOptions(
            apiLocations.map((loc: Location) => {
                return {
                    value: loc.id!,
                    label: loc.description
                };
            })
        );
        setLoading(false);
    }, [apiLocations]);

    useEffect(() => {
        const fetchData = async () => {
            await getCustomColumns(VertexLabel.ITEM, setItemCustomCols);
            await getCustomColumns(VertexLabel.LOCATION, setLocationCustomCols);
        };
        fetchData();
    }, []);

    if (loading) {
        return <div> Loading... </div>;
    }

    return (
        <Box sx={{ bgcolor: "background.paper" }}>
            {locationModalError && (
                <Alert
                    onDismiss={() => setLocationModalError(false)}
                    dismissible
                    statusIconAriaLabel="error"
                    type="error"
                    header="">
                    {modalErrorMsg}
                </Alert>
            )}
            <CRUDTable
                customCols={locationCustomCols}
                setTableCustomColsData={setLocationCustomCols}
                tableData={locationData}
                setTableData={setLocationData}
                dataType={"location"}
                currentLocationId={locationId}
                setModalError={setLocationModalError}
                modalErrorMsg={modalErrorMsg}
                setModalErrorMsg={setModalErrorMsg}
                locations={locationOptions}
                setDropdown={setLocationOptions}
                setNodes={setNodes}
                setEdges={setEdges}
            />
            {locationData.length > 0 && (
                <>
                    <InteractionFlow
                        nodes={nodes}
                        edges={edges}
                        setNodes={setNodes}
                        setEdges={setEdges}
                        onSelect={onLocationSelect}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                    />
                </>
            )}
            {modalError && (
                <Alert
                    onDismiss={() => setModalError(false)}
                    dismissible
                    statusIconAriaLabel="error"
                    type="error"
                    header="">
                    {modalErrorMsg}
                </Alert>
            )}

            <Dropdown
                options={locationOptions}
                dropdownType={"a location"}
                onChange={onLocationSelect}
                selectedOption={selectedLocation}
                setSelectedOption={setSelectedLocation}
            />
            {tabsGenerate && (
                <>
                    {
                        <Tabs value={tabValue} onChange={tabChange} variant="fullWidth" centered>
                            <Tab label="Inventory" />
                            <Tab
                                disabled={currentLocation && currentLocation.type === LocationType.DISTRIBUTOR}
                                label="Inventory Plans"
                            />
                            <Tab label="Transfer Plans" />
                            <Tab label="Downstream Locations" />
                            <Tab label="Upstream Locations" />
                        </Tabs>
                    }
                    {tabValue === 0 && (
                        <CRUDTable
                            customCols={itemCustomCols}
                            setTableCustomColsData={setItemCustomCols}
                            tableData={inventoryData}
                            setTableData={setInventoryData}
                            dataType={"item"}
                            currentLocationId={locationId}
                            setDropdown={setItems}
                            setSkuList={setSkuList}
                            setModalError={setModalError}
                            modalErrorMsg={modalErrorMsg}
                            setModalErrorMsg={setModalErrorMsg}
                            setErrorType={setErrorType}
                            errorType={errorType}
                        />
                    )}
                    {tabValue === 1 && (
                        <CRUDTable
                            customCols={[]}
                            setTableCustomColsData={() => null}
                            tableData={plansData}
                            setTableData={setPlansData}
                            dataType={"inventory-plan"}
                            currentLocationId={locationId}
                            skuList={skuList}
                            setModalError={setModalError}
                            modalErrorMsg={modalErrorMsg}
                            setModalErrorMsg={setModalErrorMsg}
                            selectedLocation={currentLocation}
                        />
                    )}
                    {tabValue === 2 && (
                        <CRUDTable
                            customCols={[]}
                            setTableCustomColsData={() => null}
                            tableData={transferPlansData}
                            setTableData={setTransferPlansData}
                            dataType={"transfer-plan"}
                            locations={locationOptions}
                            currentLocationId={locationId}
                            skuList={skuList}
                            setModalError={setModalError}
                            modalErrorMsg={modalErrorMsg}
                            setModalErrorMsg={setModalErrorMsg}
                            setErrorType={setErrorType}
                            errorType={errorType}
                            enableEditing={false}
                        />
                    )}
                    {tabValue === 3 && (
                        <CRUDTable
                            customCols={[]}
                            setTableCustomColsData={() => null}
                            tableData={downstreamData}
                            setTableData={setDownstreamData}
                            dataType={"downstream"}
                            currentLocationId={locationId}
                            locations={locationOptions}
                            setModalError={setModalError}
                            modalErrorMsg={modalErrorMsg}
                            setModalErrorMsg={setModalErrorMsg}
                            setNodes={setNodes}
                            setEdges={setEdges}
                        />
                    )}
                    {tabValue === 4 && (
                        <CRUDTable
                            customCols={[]}
                            setTableCustomColsData={() => null}
                            tableData={upstreamData}
                            setTableData={setUpstreamData}
                            dataType={"upstream"}
                            currentLocationId={locationId}
                            locations={locationOptions}
                            setModalError={setModalError}
                            modalErrorMsg={modalErrorMsg}
                            setModalErrorMsg={setModalErrorMsg}
                            setNodes={setNodes}
                            setEdges={setEdges}
                        />
                    )}
                </>
            )}

            <Dropdown options={items} dropdownType={"an item"} onChange={onItemSelect} />
            {locationId.length > 0 && itemId.length > 0 && (
                <DaysTable numDays={30} itemId={itemId} projections={projections} />
            )}
        </Box>
    );
}
