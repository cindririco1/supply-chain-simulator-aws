// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { API } from "aws-amplify";
import * as Case from "case";
import { CustomField } from "neptune/model/custom-field";
import { InvalidItem } from "neptune/model/invalidItem";
import { Location } from "neptune/model/location";
import React from "react";
import { MarkerType } from "reactflow";
import { LocationType, TransferPlanStatus, VertexLabel } from "../constants";
import { generateToken } from "../utils/apiHelper";
import { trimAllWhiteSpaces } from "../utils/stringHelper";
import { CustomColumnDef, CustomFieldChangeRequest } from "./customize-field-modal";
import { LocationNodeData } from "./nodes/locationNode";
import { check } from "prettier";
import { locationItem } from "../types/helperTypes";

let token: string;

export const getItemId = async (item: string, locationId: string) => {
    token = await generateToken();
    const data = await API.get("supply-chain-simulator-on-aws-api", `item/location/${locationId}`, {
        headers: {
            Authorization: token
        }
    });
    for (const dataItems of data["items"]) {
        if (dataItems["sku"] === item) {
            return dataItems["id"];
        }
    }
};

export const getTransfers = async (locationId: string) => {
    token = await generateToken();
    const upstream = await API.get("supply-chain-simulator-on-aws-api", "location/transfer/upstream/" + locationId, {
        headers: {
            Authorization: token
        }
    });
    const downstream = await API.get(
        "supply-chain-simulator-on-aws-api",
        "location/transfer/downstream/" + locationId,
        {
            headers: {
                Authorization: token
            }
        }
    );

    const transferMap = new Map<string, number>();
    for (const location of upstream["locations"]) {
        transferMap.set(location["description"], location["leadTime"]);
    }
    for (const location of downstream["locations"]) {
        transferMap.set(location["description"], location["leadTime"]);
    }

    return transferMap;
};

export const getCustomColumns = async (
    datatype: string,
    setCustomColumns: React.Dispatch<React.SetStateAction<CustomColumnDef[]>>
) => {
    token = await generateToken();
    const data = await API.get("supply-chain-simulator-on-aws-api", `custom-field/${datatype}`, {
        headers: {
            Authorization: token
        }
    });

    const fields = data.customFields as CustomField[];
    const columns: any = [];
    fields.forEach(field =>
        columns.push({
            fieldName: field.fieldName,
            fieldType: field.fieldType
        })
    );
    setCustomColumns(columns);

    return columns;
};

export const postCustomColumns = async (
    datatype: string,
    columns: CustomColumnDef[],
    deletedColumns: CustomColumnDef[]
) => {
    token = await generateToken();

    const addedCustomFields = columns.map(column => {
        return { fieldName: trimAllWhiteSpaces(column.fieldName), fieldType: column.fieldType };
    });
    const deletedCustomFields = deletedColumns.map(column => {
        return { fieldName: trimAllWhiteSpaces(column.fieldName), fieldType: column.fieldType };
    });
    const body: CustomFieldChangeRequest = { customFields: { new: addedCustomFields, delete: deletedCustomFields } };

    await API.post("supply-chain-simulator-on-aws-api", `custom-field/${datatype}`, {
        headers: {
            Authorization: token
        },
        body: body
    });
};

export const deleteTableItems = async (
    /* eslint-disable @typescript-eslint/no-explicit-any */
    rowContent: any,
    apiName: string,
    locationId: string,
    mapLocationId: Map<string, string>
) => {
    token = await generateToken();

    const locationTransferPayload: any = {};

    if (apiName === "downstream" || apiName === "upstream") {
        locationTransferPayload.fromLocationId =
            apiName === "downstream" ? locationId : mapLocationId.get(rowContent[apiName]);
        locationTransferPayload.toLocationId =
            apiName === "upstream" ? locationId : mapLocationId.get(rowContent[apiName]);
        apiName = "location/transfer";
    }

    try {
        await API.del("supply-chain-simulator-on-aws-api", `${apiName}`, {
            body: apiName !== "location/transfer" ? { id: rowContent["id"] } : locationTransferPayload,
            headers: {
                Authorization: token
            }
        });
    } catch (error: any) {
        console.log("error REST API:", error.response);
    }
};

export const updateTableItems = async (
    rowContent: any,
    apiName: string,
    customColumns: CustomColumnDef[],
    locationItem: locationItem,
    apiData?: any,
    setModalErrorMsg?: React.Dispatch<React.SetStateAction<string>>,
    setErrorType?: React.Dispatch<React.SetStateAction<string>>
) => {
    token = await generateToken();

    try {
        const apiMap: any = {
            item: {
                sku: trimAllWhiteSpaces(rowContent["sku"]),
                amount: parseInt(rowContent["amount"]),
                userDefinedFields: setCustomFields(customColumns, rowContent),
                id: apiData["id"]
            },
            "inventory-plan": {
                itemId: locationItem.itemId,
                inventoryPlan: {
                    startDate: rowContent["date"], // Type needs discussion for Date/String
                    endDate: rowContent["date"], // Type needs discussion for Date/String
                    turnoverHour: parseInt(rowContent["turnoverHour"]), // hour from 0 to 23
                    planType: rowContent["planType"],
                    dailyRate: parseInt(rowContent["dailyRate"]),
                    id: apiData["id"]
                }
            },
            location: {
                description: trimAllWhiteSpaces(rowContent["location"]),
                type: rowContent["type"],
                userDefinedFields: setCustomFields(customColumns, rowContent),
                id: apiData["id"]
            },
            downstream: {
                fromLocationId: locationItem.locationId,
                toLocationId: apiData["id"],
                leadTime: parseInt(rowContent["leadTime"])
            },
            upstream: {
                fromLocationId: apiData["id"],
                toLocationId: locationItem.locationId,
                leadTime: parseInt(rowContent["leadTime"])
            }
        };

        let path: string;
        if (apiName === "downstream" || apiName === "upstream") {
            path = "location/transfer";
        } else {
            path = apiName;
        }
        await API.put("supply-chain-simulator-on-aws-api", `${path}`, {
            body: apiMap[apiName],
            headers: {
                Authorization: token
            }
        });
        return true;
    } catch (error: any) {
        console.log("error REST API:", error.response);
        if (setErrorType) {
            if (error.response.status === 500) {
                setErrorType("transferAmount");
            } else {
                setErrorType("sku");
            }
        }
        if (setModalErrorMsg) setModalErrorMsg(error.response.data.message);
        return false;
    }
};

export const postTableContent = async (
    rowContent: any,
    apiName: string,
    mapLocationId: Map<string, string>,
    customColumns: CustomColumnDef[],
    locationItem: locationItem,
    setModalErrorMsg?: React.Dispatch<React.SetStateAction<string>>,
    setErrorType?: React.Dispatch<React.SetStateAction<string>>
) => {
    token = await generateToken();
    const locationTransferPayload: any = {};

    if (apiName === "downstream" || apiName === "upstream") {
        locationTransferPayload.fromLocationId =
            apiName === "downstream" ? locationItem.locationId : mapLocationId.get(rowContent[apiName]);
        locationTransferPayload.toLocationId =
            apiName === "upstream" ? locationItem.locationId : mapLocationId.get(rowContent[apiName]);
        locationTransferPayload.leadTime = parseInt(rowContent["leadTime"]);
        apiName = "location/transfer";
    }
    try {
        const apiMap: any = {
            item: {
                locationId: locationItem.locationId,
                item: {
                    sku: trimAllWhiteSpaces(rowContent["sku"]),
                    description: rowContent["description"],
                    amount: parseInt(rowContent["amount"]),
                    dateEntered: "",
                    userDefinedFields: setCustomFields(customColumns, rowContent)
                }
            },
            "inventory-plan": {
                itemId: locationItem.itemId,
                inventoryPlan: {
                    startDate: rowContent["date"],
                    endDate: rowContent["date"],
                    turnoverHour: parseInt(rowContent["turnoverHour"]),
                    planType: rowContent["planType"],
                    dailyRate: parseInt(rowContent["dailyRate"])
                }
            },
            location: {
                description: rowContent["location"],
                type: rowContent["type"],
                userDefinedFields: setCustomFields(customColumns, rowContent)
            },
            "transfer-plan": {
                fromLocationId: mapLocationId.get(rowContent["fromLocation"]),
                toLocationId: mapLocationId.get(rowContent["toLocation"]),
                sku: rowContent["sku"],
                transferPlan: {
                    shipDate: rowContent["shipDate"],
                    arrivalDate: rowContent["arrivalDate"],
                    transferAmount: parseInt(rowContent["transferAmount"]),
                    status: TransferPlanStatus.NEW
                }
            },
            "location/transfer": locationTransferPayload
        };
        await API.post("supply-chain-simulator-on-aws-api", `${apiName}`, {
            body: apiMap[apiName],
            headers: {
                Authorization: token
            }
        });
        return true;
    } catch (error: any) {
        const data = error.response.data;
        checkErrorType(error, setErrorType!);

        let errorMessage = data.message;
        if (apiName === "transfer-plan") {
            errorMessage = `${errorMessage} ${rowContent[data.transfer]}`;
        }
        if (setModalErrorMsg) setModalErrorMsg(errorMessage);
        return false;
    }
};

const checkErrorType = (error: any, setErrorType: React.Dispatch<React.SetStateAction<string>>) => {
    if (setErrorType) {
        if (error.response.status === 500) {
            setErrorType("transferAmount");
        } else {
            setErrorType("sku");
        }
    }
};

export const populateTableDistributer = async (
    setTable: React.Dispatch<React.SetStateAction<any[]>>,
    apiName: string,
    customColumns: CustomColumnDef[],
    setDropdown?: React.Dispatch<React.SetStateAction<any[]>>,
    setSkuList?: React.Dispatch<React.SetStateAction<any[]>>,
    locationId?: string,
    nodesAndEdgesSetters?: {
        setNodes?: React.Dispatch<React.SetStateAction<any[]>>;
        setEdges?: React.Dispatch<React.SetStateAction<any[]>>;
    }
) => {
    if (apiName === "location" && setDropdown)
        populateLocationTable(customColumns, nodesAndEdgesSetters!.setNodes, nodesAndEdgesSetters!.setEdges);
    else if (apiName === "item") populateItemTable(customColumns, setTable, setSkuList, locationId, setDropdown);
    else if (apiName === "upstream" || apiName === "downstream")
        populateUpDownStreamTable(
            apiName,
            setTable,
            locationId,
            nodesAndEdgesSetters!.setNodes,
            nodesAndEdgesSetters!.setEdges
        );
    else if (apiName === "inventory-plan") populateInventoryPlanTable(setTable, locationId);
    else populateTransferPlanTable(setTable, locationId);
};

export const populateLocationTable = async (
    customColumns: CustomColumnDef[],
    setNodes?: React.Dispatch<React.SetStateAction<any[]>>,
    setEdges?: React.Dispatch<React.SetStateAction<any[]>>
) => {
    if (setNodes && setEdges) loadGraph(setNodes, setEdges);
};

export const populateItemTable = async (
    customColumns: CustomColumnDef[],
    setTable?: React.Dispatch<React.SetStateAction<any[]>>,
    setSkuList?: React.Dispatch<React.SetStateAction<any[]>>,
    locationId?: string,
    setItems?: React.Dispatch<React.SetStateAction<any[]>>
) => {
    const tableItems: any = [];
    const dropdownList: any[] = [];

    const tempSkuList: any = [];
    token = await generateToken();
    const data = await API.get("supply-chain-simulator-on-aws-api", `item/location/${locationId}`, {
        headers: {
            Authorization: token
        }
    });

    for (const key of data["items"]) {
        const tempObj: any = {};
        tempObj.sku = key["sku"];
        tempSkuList.push(tempObj.sku);
        tempObj.amount = key["amount"];
        tempObj.description = key["description"];
        tempObj.id = key["id"];
        getCustomFields(customColumns, tempObj, key);
        tableItems.push(tempObj);
        dropdownList.push({ label: key["sku"], value: key["id"] });
    }

    if (setItems) setItems(dropdownList);
    if (setSkuList) setSkuList(tempSkuList);
    if (setTable) setTable(tableItems);
};

export const populateProjectionsTable = async (
    setProjections: React.Dispatch<React.SetStateAction<any[]>>,
    // using any type here because the number of days can be configured (day1, day2, etc...)
    // and therefore we can't make a typed interface to capture all days in the code ahead of time
    projections?: Record<string, any>[],
    itemId?: string
) => {
    const headersData: object[] = [
        { projectionType: "Supply (In-Transit)" },
        { projectionType: "Supply (Planned)" },
        { projectionType: "Inventory (Beginning on Hand)" },
        { projectionType: "Inventory (Ending on Hand)" },
        { projectionType: "Demand (Planned)" }
    ];
    if (itemId) {
        const token = await generateToken();
        const data = await API.get("supply-chain-simulator-on-aws-api", `projection/${itemId}`, {
            headers: {
                Authorization: token
            }
        });

        projections = data["projections"];
    }

    // has to be any, see projections comment above
    const rows = {
        supply: {
            inTransit: {},
            onHand: {}
        },
        inventory: {
            boh: {},
            eoh: {}
        },
        demand: {
            planned: {}
        }
    } as any;

    if (projections) {
        for (const projection of projections) {
            rows.supply.inTransit[`day${projection["daysOut"]}`] = projection["supplyInTransit"];
            rows.supply.onHand[`day${projection["daysOut"]}`] = projection["supplyPlanned"];
            rows.inventory.boh[`day${projection["daysOut"]}`] = projection["inventoryBeginningOnHand"];
            rows.inventory.eoh[`day${projection["daysOut"]}`] = projection["inventoryEndingOnHand"];
            rows.demand.planned[`day${projection["daysOut"]}`] = projection["demandPlanned"];
        }
    }

    const table = headersData;
    table[0] = { ...table[0], ...rows.supply.inTransit };
    table[1] = { ...table[1], ...rows.supply.onHand };
    table[2] = { ...table[2], ...rows.inventory.boh };
    table[3] = { ...table[3], ...rows.inventory.eoh };
    table[4] = { ...table[4], ...rows.demand.planned };

    setProjections(table);
};

export const populateUpDownStreamTable = async (
    relationship: string,
    setTable?: React.Dispatch<React.SetStateAction<any[]>>,
    locationId?: string,
    setNodes?: React.Dispatch<React.SetStateAction<any[]>>,
    setEdges?: React.Dispatch<React.SetStateAction<any[]>>
) => {
    const tableItems: any = [];
    token = await generateToken();
    const data = await API.get("supply-chain-simulator-on-aws-api", `location/transfer/${relationship}/${locationId}`, {
        headers: {
            Authorization: token
        }
    });
    for (const key of data["locations"]) {
        const tempObj: any = {};
        tempObj[relationship] = key["description"];
        tempObj.leadTime = key["leadTime"];
        tempObj.id = key["id"];
        tableItems.push(tempObj);
    }
    if (setTable) setTable(tableItems);
    if (setNodes && setEdges) loadGraph(setNodes, setEdges);
};

export const populateInventoryPlanTable = async (
    setTable?: React.Dispatch<React.SetStateAction<any[]>>,
    locationId?: string
) => {
    const tableItems: any = [];
    token = await generateToken();
    const data = await API.get("supply-chain-simulator-on-aws-api", `inventory-plan/location/${locationId}`, {
        headers: {
            Authorization: token
        }
    });
    for (const key of data["inventoryPlans"]) {
        const tempObj: any = {};
        tempObj.date = key["inventoryPlan"]["startDate"]; // Hotfix - Update Inventory Plan to be one-time
        tempObj.turnoverHour = key["inventoryPlan"]["turnoverHour"];
        tempObj.planType = key["inventoryPlan"]["planType"];
        tempObj.dailyRate = key["inventoryPlan"]["dailyRate"];
        tempObj.sku = key["item"]["sku"];

        tempObj.id = key["inventoryPlan"]["id"];
        tableItems.push(tempObj);
    }
    if (setTable) setTable(tableItems);
};

export const populateTransferPlanTable = async (
    setTable?: React.Dispatch<React.SetStateAction<any[]>>,
    locationId?: string
) => {
    const tableItems: any = [];
    token = await generateToken();
    const data = await API.get("supply-chain-simulator-on-aws-api", `transfer-plan/${locationId}`, {
        headers: {
            Authorization: token
        }
    });

    for (const key of data["transferPlans"]) {
        const tempObj: any = {};
        tempObj.fromLocation = key["fromLocation"]["description"];
        tempObj.toLocation = key["toLocation"]["description"];
        tempObj.shipDate = key["transferPlan"]["shipDate"];
        tempObj.arrivalDate = key["transferPlan"]["arrivalDate"];
        tempObj.transferAmount = key["transferPlan"]["transferAmount"];
        tempObj.status = key["transferPlan"]["status"];
        tempObj.sku = key["item"]["sku"];

        tempObj.id = key["transferPlan"]["id"];
        tableItems.push(tempObj);
    }
    if (setTable) setTable(tableItems);
};

export const loadGraph = async (
    setNodes: React.Dispatch<React.SetStateAction<any[]>>,
    setEdges: React.Dispatch<React.SetStateAction<any[]>>
) => {
    token = await generateToken();
    const data = await API.get("supply-chain-simulator-on-aws-api", "graph", {
        headers: {
            Authorization: token
        }
    });
    const locations: Location[] = data["locations"];

    const exceptions = await maplocationIdToInvalidItems(locations.map(location => location.id!));
    const edges = data["transfers"] || [];
    const base_x = new Map<LocationType, number>([
        [LocationType.MANUFACTURER, 0],
        [LocationType.DISTRIBUTOR, 0],
        [LocationType.SELLER, 0]
    ]);
    setNodes(() => {
        return locations.map((location: Location) => {
            let y: number;
            switch (location.type) {
                case LocationType.MANUFACTURER:
                    y = 0;
                    break;
                case LocationType.DISTRIBUTOR:
                    y = 100;
                    break;
                case LocationType.SELLER:
                    y = 200;
                    break;
                default: {
                    y = -100;
                    console.log("Invalid Location Type");
                }
            }
            base_x.set(location.type as LocationType, (base_x.get(location.type as LocationType) as number) + 250);
            const data: LocationNodeData = {
                title: location.description,
                locationType: location.type,
                exception: createExceptionMessage(location.id!, exceptions)
            };
            return {
                id: location.id as string,
                data,
                type: VertexLabel.LOCATION,
                position: { x: base_x.get(location.type as LocationType) as number, y: y },
                width: 5
            };
        });
    });
    setEdges(() => {
        return edges.map((edge: any) => {
            return {
                id: edge.edge.id,
                source: edge.from.id,
                target: edge.to.id,
                markerEnd: {
                    type: MarkerType.Arrow,
                    color: "#0972d3"
                },
                style: {
                    strokeWidth: 2,
                    stroke: "#0972d3"
                }
            };
        });
    });
};

export const createExceptionMessage = (
    locationId: string,
    exceptions: { id: string; data: InvalidItem[] }[]
): string | undefined => {
    const foundException = exceptions.find(
        (exception: { id: string; data: InvalidItem[] }) => exception.id === locationId && exception.data.length > 0
    );
    return checkFoundException(foundException);
};

const checkFoundException = (foundException: { id: string; data: InvalidItem[] } | undefined): string | undefined => {
    if (foundException !== undefined) {
        if (foundException.data.length > 1) {
            return `Low inventory for ${foundException.data.length} items`;
        } else {
            return `Low inventory for SKU ${foundException.data[0].sku}`;
        }
    } else {
        return undefined;
    }
};

export const maplocationIdToInvalidItems = async (
    locationIds: string[]
): Promise<{ id: string; data: InvalidItem[] }[]> => {
    return await Promise.all(
        locationIds.map(async (id: string) => {
            const data = await getInvalidItemsByLocation(id);
            return { id, data };
        })
    );
};

export const getInvalidItemsByLocation = async (locationId: string): Promise<InvalidItem[]> => {
    token = await generateToken();
    const data = await API.get("supply-chain-simulator-on-aws-api", `exception/location/${locationId}`, {
        headers: {
            Authorization: token
        }
    });
    return data.results;
};

export const getCustomFields = (customColumns: CustomColumnDef[], object: any, rawObject: any) => {
    const userDefinedFields = JSON.parse(rawObject["userDefinedFields"]);
    for (const customColumn of customColumns) {
        const camelFieldName = Case.camel(customColumn.fieldName);
        object[camelFieldName] = userDefinedFields[customColumn.fieldName];
    }
    return object;
};

export const setCustomFields = (customColumns: CustomColumnDef[], values: any) => {
    const userDefinedFields = {} as any;
    for (const customColumn of customColumns) {
        const camelFieldName = Case.camel(customColumn.fieldName);
        userDefinedFields[customColumn.fieldName] = values[camelFieldName];
    }

    return JSON.stringify(userDefinedFields);
};
