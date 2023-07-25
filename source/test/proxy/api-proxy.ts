// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import fetch from "node-fetch";
import { LocationType, VertexLabel } from "shared/neptune/model/constants";
import { CustomField } from "shared/neptune/model/custom-field";
import { InventoryPlan } from "shared/neptune/model/inventory-plan";
import { Item } from "shared/neptune/model/item";
import { Location } from "shared/neptune/model/location";
import { TransferPlan } from "shared/neptune/model/transfer-plan";
import { AuthHandler } from "../util/auth-handler";
import { Config } from "../util/config";
import { fetchWithTry } from "../util/fetch-with-try";
import { logger } from "../util/logger";
import { CfProxy } from "./cf-proxy";

export enum HTTPMethod {
    DELETE = "DELETE",
    GET = "GET",
    POST = "POST",
    PUT = "PUT"
}

export class ApiProxy {
    private readonly endpoint: string;
    private readonly authHandler: AuthHandler;
    private readonly disableAuth: boolean;

    constructor(config: Config, endpoint: string, cfProxy: CfProxy, disableAuth?: boolean) {
        this.endpoint = endpoint;
        this.authHandler = new AuthHandler(config, cfProxy);
        this.disableAuth = disableAuth ?? false;
    }
    /**
     * Get the authentication header via calling Cognito.
     */
    public async getRequestInit(method: HTTPMethod, body?: string) {
        const requestInit = {
            method: method
        } as any;
        if (!this.disableAuth) {
            const token = await this.authHandler.getToken();
            requestInit.headers = {
                Authorization: "Bearer " + token
            };
        }
        if (method !== HTTPMethod.GET) {
            requestInit.headers = {
                ...requestInit.headers,
                "Content-Type": "application/json"
            };
        }
        if (body) {
            requestInit.body = body;
        }
        return requestInit;
    }

    /**
     * Get an array of locations from the neptune db via `GetAllLocationsApi`.
     */
    public async getAllLocation() {
        const url = this.endpoint + `location`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).locations
        );
    }

    /**
     * Get a location by ID from the neptune db via `GetLocationsApi`.
     */
    public async getLocation(locationId: string) {
        const url = this.endpoint + `location/${locationId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).location
        );
    }

    /**
     * Get an array of locations by type from the neptune db via `GetLocationByTypeApi`.
     */
    public async getLocationByType(type: LocationType) {
        const url = this.endpoint + `location/type/${type}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).locations
        );
    }

    /**
     * Create a new location into the neptune db via `PostLocationApi`.
     *
     * Note: Location node's description field should be unique.
     */
    public async postLocation(location: Location) {
        const url = this.endpoint + `location`;
        const body = `${JSON.stringify(location)}`;
        const init = await this.getRequestInit(HTTPMethod.POST, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).location
        );
    }

    /**
     * Update existing location into the neptune db via `PutLocationApi`.
     */
    public async putLocation(location: Location) {
        const url = this.endpoint + `location`;
        const init = await this.getRequestInit(HTTPMethod.PUT, JSON.stringify(location));

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).location
        );
    }

    /**
     * Delete an existing location from the neptune db via `DeleteLocationApi`.
     */
    public async deleteLocation(locationId: string) {
        const url = this.endpoint + `location`;
        const body = `{"id": "${locationId}"}`;
        const init = await this.getRequestInit(HTTPMethod.DELETE, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await logger.debug(res)
        );
    }

    /**
     * Creates a new transfer relationship by linking two existing location nodes via `PostTransferApi`.
     *
     * Note: fromLocation can not be a seller and toLocation can not be a manufacturer.
     */
    public async postTransfer(fromLocationId: string, toLocationId: string, leadTime: string) {
        const url = this.endpoint + `location/transfer`;
        const body = `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}", "leadTime": ${leadTime} }`;
        const init = await this.getRequestInit(HTTPMethod.POST, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).edge
        );
    }

    /**
     * Updates an existing transfer relationship via `PutTransferApi`.
     *
     * Note: fromLocation can not be a seller and toLocation can not be a manufacturer.
     */
    public async putTransfer(fromLocationId: string, toLocationId: string, leadTime: string) {
        const url = this.endpoint + `location/transfer`;
        const body = `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}", "leadTime": ${leadTime} }`;
        const init = await this.getRequestInit(HTTPMethod.PUT, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).edge
        );
    }

    public async getDownstreamTransfer(locationId: string) {
        const url = this.endpoint + `location/transfer/downstream/${locationId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).locations
        );
    }

    public async getUpstreamTransfer(locationId: string) {
        const url = this.endpoint + `location/transfer/upstream/${locationId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).locations
        );
    }

    /**
     * Deletes transfer relationship via `DeleteTransferApi`.
     */
    public async deleteTransfer(fromLocationId: string, toLocationId: string) {
        const url = this.endpoint + `location/transfer`;
        const body = `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}" }`;
        const init = await this.getRequestInit(HTTPMethod.DELETE, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).success
        );
    }

    /**
     * Fetch all items from the neptune db id via `GetAllItemApi`.
     */
    public async getAllItem() {
        const url = this.endpoint + `item`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).item
        );
    }

    /**
     * Fetch an item from the neptune db via `GetItemApi`.
     */
    public async getItem(itemId: string) {
        const url = this.endpoint + `item/${itemId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).item
        );
    }

    /**
     * Fetch items from the neptune db by location id via `GetItemByLocationApi`.
     */
    public async getItemByLocation(locationId: string) {
        const url = this.endpoint + `item/location/${locationId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).item
        );
    }

    /**
     * Create a new item into the neptune db via `PostItemApi`.
     *
     * Note: Item node's sku field should be unique. Also, a Location node's should be created prior to
     * creating an Item node.
     */
    public async postItem(locationId: string, item: Item) {
        const url = this.endpoint + `item`;
        const body = `{ "locationId": "${locationId}", "item": ${JSON.stringify(item)} }`;
        const init = await this.getRequestInit(HTTPMethod.POST, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).item
        );
    }

    /**
     * Update existing item into the neptune db via `PutItemApi`.
     *
     * Note: Item node's sku field should be unique.
     */
    public async putItem(item: Item) {
        const url = this.endpoint + `item`;
        const body = `${JSON.stringify(item)}`;
        const init = await this.getRequestInit(HTTPMethod.PUT, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await res.json()
        );
    }

    /**
     * Delete an existing item from the neptune db via `DeleteItemApi`.
     */
    public async deleteItem(itemId: string) {
        const url = this.endpoint + `item`;
        const body = `{"id": "${itemId}"}`;
        const init = await this.getRequestInit(HTTPMethod.DELETE, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await logger.debug(res)
        );
    }

    /**
     * Delete an existing itemRecord from the neptune db via `DeleteItemRecordApi`.
     */
    public async deleteItemRecord(itemRecordId: string) {
        const url = this.endpoint + `item-record`;
        const body = `{"id": "${itemRecordId}"}`;
        const init = await this.getRequestInit(HTTPMethod.DELETE, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).item
        );
    }

    /**
     * Fetch all item records from the neptune db via `GetAllItemRecordApi`.
     */
    public async getAllItemRecord() {
        const url = this.endpoint + `item-record`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return await fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).itemRecords
        );
    }

    /**
     * Fetch an item record by its id from the neptune db via `GetItemRecordApi`.
     */
    public async getItemRecord(itemRecordId: string) {
        const url = this.endpoint + `item-record/itemRecordId/`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return await fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).itemRecords
        );
    }

    /**
     * Fetch all item records associated with an item from the neptune db via `GetItemRecordByItemApi`.
     */
    public async getItemRecordsByItemId(itemId: string) {
        const url = this.endpoint + `item-record/item/${itemId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return await fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).itemRecords
        );
    }

    /**
     * Fetch an inventory plan from the neptune db via `GetInventoryPlanApi`.
     */
    public async getInventoryPlan(inventoryPlanId: string) {
        const url = this.endpoint + `inventory-plan/${inventoryPlanId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).inventoryPlan
        );
    }

    /**
     * Fetch all inventory plans from the neptune db via `GetAllInventoryPlanApi`.
     */
    public async getAllInventoryPlan() {
        const url = this.endpoint + `inventory-plan`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).inventoryPlans
        );
    }

    /**
     * Fetch an inventory plan by locationId from the neptune db via `GetInventoryPlanByLocationApi`.
     */
    public async getInventoryPlanByLocation(locationId: string) {
        const url = this.endpoint + `inventory-plan/location/${locationId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).inventoryPlans
        );
    }

    /**
     * Create a new inventory plan into the neptune db via `PostInventoryPlanApi`.
     *
     * Note: A Item node's should be created prior to creating an Inventory Plan node.
     */
    public async postInventoryPlan(itemId: string, inventoryPlan: InventoryPlan) {
        const url = this.endpoint + `inventory-plan`;
        const body = `{ "itemId": "${itemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`;
        const init = await this.getRequestInit(HTTPMethod.POST, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).inventoryPlan
        );
    }

    /**
     * Update an existing inventory plan into the neptune db via `PutInventoryPlanApi`.
     *
     * Note: A Item node's should be created prior to creating an Inventory Plan node.
     */
    public async putInventoryPlan(itemId: string, inventoryPlan: InventoryPlan) {
        const url = this.endpoint + `inventory-plan`;
        const body = `{ "itemId": "${itemId}", "inventoryPlan": ${JSON.stringify(inventoryPlan)} }`;
        const init = await this.getRequestInit(HTTPMethod.PUT, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).inventoryPlan
        );
    }

    /**
     * Delete an existing inventory plan from the neptune db via `DeleteInventoryPlanApi`.
     */
    public async deleteInventoryPlan(inventoryPlanId: string) {
        const url = this.endpoint + `inventory-plan`;
        const body = `{"id": "${inventoryPlanId}"}`;
        const init = await this.getRequestInit(HTTPMethod.DELETE, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await logger.debug(res)
        );
    }

    /**
     * Fetch all transfer plans from the neptune db via `GetAllTransferPlanApi`.
     */
    public async getAllTransferPlan() {
        const url = this.endpoint + `transfer-plan`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).transferPlans
        );
    }

    /**
     * Fetch a transfer plan by location from the neptune db via `GetTransferPlanByLocationApi`.
     */
    public async getTransferPlanByLocation(locationId: string) {
        const url = this.endpoint + `transfer-plan/${locationId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).transferPlans
        );
    }

    /**
     * Fetch a transfer plan by take location from the neptune db via `GetTransferPlanByTakeLocationApi`.
     */
    public async getTransferPlanByTakeLocation(locationId: string) {
        const url = this.endpoint + `transfer-plan/takes/${locationId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).transferPlansWithItems
        );
    }

    /**
     * Fetch a transfer plan by give location from the neptune db via `GetTransferPlanByGiveLocationApi`.
     */
    public async getTransferPlanByGiveLocation(locationId: string) {
        const url = this.endpoint + `transfer-plan/gives/${locationId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).transferPlansWithItems
        );
    }

    /**
     * Create a new transfer plan into the neptune db via `PostTransferPlanApi`.
     *
     * Note: Two item nodes should be created prior to creating an Inventory Plan node: an item links to `from location`
     * and an item links to `to location`.
     */
    public async postTransferPlan(
        givingLocationId: string,
        takingLocationId: string,
        sku: string,
        transferPlan: TransferPlan
    ) {
        const url = this.endpoint + `transfer-plan`;
        const body = `{ "fromLocationId": "${givingLocationId}", "toLocationId": "${takingLocationId}", "sku": "${sku}", "transferPlan": ${JSON.stringify(
            transferPlan
        )} }`;
        const init = await this.getRequestInit(HTTPMethod.POST, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).transferPlan
        );
    }

    /**
     * Update an existing transfer plan into the neptune db via `PutTransferPlanApi`.
     */
    public async putTransferPlan(transferPlan: TransferPlan) {
        const url = this.endpoint + `transfer-plan`;
        const body = `{ "transferPlan": ${JSON.stringify(transferPlan)} }`;
        const init = await this.getRequestInit(HTTPMethod.PUT, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).transferPlan
        );
    }

    /**
     * Create an existing transfer plan from the neptune db via `DeleteTransferPlanApi`.
     */
    public async deleteTransferPlan(transferPlanId: string) {
        const url = this.endpoint + `transfer-plan`;
        const body = `{"id": "${transferPlanId}"}`;
        const init = await this.getRequestInit(HTTPMethod.DELETE, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await logger.debug(res)
        );
    }

    /**
     * Get projections.
     */
    public async getProjections(itemId: string) {
        const url = this.endpoint + `projection/${itemId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await res.json()
        );
    }

    /**
     * Get future dates.
     */
    public async getFutureDates(itemId: string) {
        const url = this.endpoint + `projection/future-date/${itemId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await res.json()
        );
    }

    /**
     * Get an array of invalid items from the neptune db via `GetExceptionApi`.
     */
    public async getExceptions() {
        const url = this.endpoint + `exception`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await res.json()
        );
    }

    /**
     * Get an array of invalid items from the neptune db via `GetExceptionByItemApi`.
     */
    public async getExceptionsByItem(itemId: string) {
        const url = this.endpoint + `exception/item/${itemId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await res.json()
        );
    }

    /**
     * Get an array of invalid items from the neptune db via `GetExceptionByLocationApi`.
     */
    public async getExceptionsByLocation(locationId: string) {
        const url = this.endpoint + `exception/location/${locationId}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await res.json()
        );
    }

    /**
     * Get an array of custom fields from the neptune db via `GetCustomFieldApi`.
     */
    public async getCustomFields(label: VertexLabel) {
        const url = this.endpoint + `custom-field/${label}`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => (await res.json()).customFields
        );
    }

    /**
     * Overwrite the existing custom fields in the neptune db via `PostCustomFieldApi`.
     */
    public async postCustomFields(
        label: VertexLabel,
        newCustomFields: CustomField[],
        deleteCustomFields: CustomField[]
    ) {
        const url = this.endpoint + `custom-field/${label}`;
        const body = `{"customFields": 
                        {"new": ${JSON.stringify(newCustomFields)}, "delete": ${JSON.stringify(deleteCustomFields)}}}`;
        const init = await this.getRequestInit(HTTPMethod.POST, body);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await res.json()
        );
    }

    /**
     * Get graph's locations and transfers in neptune db via `GetGraphAPI`.
     */
    public async getGraph() {
        const url = this.endpoint + `graph`;
        const init = await this.getRequestInit(HTTPMethod.GET);

        return fetchWithTry(
            () => fetch(url, init),
            async res => await res.json()
        );
    }
}
