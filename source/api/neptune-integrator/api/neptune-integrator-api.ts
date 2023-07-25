// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getParameterCaseInsensitive } from "util/objectUtil";
import { GetCustomFieldApi } from "./custom-field/get/get-custom-field-api";
import { PostCustomFieldApi } from "./custom-field/post/post-custom-field-api";
import { DeleteLocationApi } from "./location/delete/delete-location-api";
import { GetAllLocationsApi } from "./location/get/get-all-location-api";
import { GetLocationApi } from "./location/get/get-location-api";
import { GetLocationByTypeApi } from "./location/get/get-location-by-type-api";
import { PostLocationApi } from "./location/post/post-location-api";
import { PutLocationApi } from "./location/put/put-location-api";

import { DeleteTransferApi } from "./location/transfer-relationship/delete/delete-transfer-api";
import { GetAllDownstreamTransferApi } from "./location/transfer-relationship/get/get-downstream-transfer-api";
import { GetAllUpstreamTransferApi } from "./location/transfer-relationship/get/get-upstream-transfer-api";
import { PostTransferApi } from "./location/transfer-relationship/post/post-transfer-api";
import { PutTransferApi } from "./location/transfer-relationship/put/put-transfer-api";

import { DeleteItemApi } from "./item/delete/delete-item-api";
import { GetAllItemApi } from "./item/get/get-all-item-api";
import { GetItemApi } from "./item/get/get-item-api";
import { GetItemByLocationApi } from "./item/get/get-item-by-location-api";
import { PostItemApi } from "./item/post/post-item-api";
import { PutItemApi } from "./item/put/put-item-api";

import { DeleteItemRecordApi } from "./item-record/delete/delete-item-record-api";
import { GetAllItemRecordApi } from "./item-record/get/get-all-item-record-api";
import { GetItemRecordApi } from "./item-record/get/get-item-record-api";

import { DeleteInventoryPlanApi } from "./inventory-plan/delete/delete-inventory-plan-api";
import { GetAllInventoryPlanApi } from "./inventory-plan/get/get-all-inventory-plan-api";
import { GetInventoryPlanApi } from "./inventory-plan/get/get-inventory-plan-api";
import { GetInventoryPlanByLocationApi } from "./inventory-plan/get/get-inventory-plan-by-location-api";
import { PostInventoryPlanApi } from "./inventory-plan/post/post-inventory-plan-api";
import { PutInventoryPlanApi } from "./inventory-plan/put/put-inventory-plan-api";

import { GetAllTransferPlanApi } from "./transfer-plan/get/get-all-transfer-plan-api";
import { GetTransferPlanByGiveLocationApi } from "./transfer-plan/get/get-transfer-plan-by-give-location-api";
import { GetTransferPlanByLocationApi } from "./transfer-plan/get/get-transfer-plan-by-location-api";
import { GetTransferPlanByTakeLocationApi } from "./transfer-plan/get/get-transfer-plan-by-take-location-api";

import { DeleteTransferPlanApi } from "./transfer-plan/delete/delete-transfer-plan-api";
import { PostTransferPlanApi } from "./transfer-plan/post/post-transfer-plan-api";
import { PutTransferPlanApi } from "./transfer-plan/put/put-transfer-plan-api";

import { GetFutureDateApi } from "./projection/get/get-future-date-api";

import { GetExceptionApi } from "./exception/get/get-exception-api";
import { GetExceptionByItemApi } from "./exception/get/get-exception-by-item-api";
import { GetExceptionByLocationApi } from "./exception/get/get-exception-by-location-api";

import { GetGraphApi } from "./graph/get/get-graph-api";

import { ApiInterface, apiResponses } from "api/api-interface";
import { ApiResponse } from "api/api-response";
import { PROPERTIES_ERROR, UNEXPECTED_PROPERTIES_ERROR } from "api/validation";
import { APIGatewayProxyEventHeaders, APIGatewayProxyEventQueryStringParameters } from "aws-lambda";
import { NeptuneDB } from "neptune/db/neptune-db";
import Logger from "util/logger";
import { GetItemRecordByItemApi } from "./item-record/get/get-item-record-by-item-api";
import { GetProjectionApi } from "./projection/get/get-projection-api";

export class NeptuneIntegratorApi {
    mappings: Map<string, ApiInterface>;
    db: NeptuneDB;
    acceptedMethods: string[] = ["GET", "PUT", "POST", "DELETE"];
    logger: Logger;

    constructor() {
        this.logger = new Logger(this.constructor.name);
    }

    private async setup() {
        if (this.mappings === undefined) {
            this.logger.debug("Setting up api");
            this.db = new NeptuneDB();
            this.setupRouteMappings();
        } else {
            this.logger.debug("Skipping setup");
        }
    }

    private setupRouteMappings() {
        this.mappings = new Map<string, ApiInterface>();
        this.mappings.set("GET /custom-field/{label}", new GetCustomFieldApi(this.db));
        this.mappings.set("POST /custom-field/{label}", new PostCustomFieldApi(this.db));
        this.mappings.set("GET /location", new GetAllLocationsApi(this.db));
        this.mappings.set("POST /location", new PostLocationApi(this.db));
        this.mappings.set("PUT /location", new PutLocationApi(this.db));
        this.mappings.set("DELETE /location", new DeleteLocationApi(this.db));
        this.mappings.set("GET /location/{location}", new GetLocationApi(this.db));
        this.mappings.set("GET /location/type/{type}", new GetLocationByTypeApi(this.db));

        this.mappings.set("DELETE /location/transfer", new DeleteTransferApi(this.db));
        this.mappings.set("GET /location/transfer/downstream/{location}", new GetAllDownstreamTransferApi(this.db));
        this.mappings.set("GET /location/transfer/upstream/{location}", new GetAllUpstreamTransferApi(this.db));
        this.mappings.set("POST /location/transfer", new PostTransferApi(this.db));
        this.mappings.set("PUT /location/transfer", new PutTransferApi(this.db));

        this.mappings.set("GET /item", new GetAllItemApi(this.db));
        this.mappings.set("POST /item", new PostItemApi(this.db));
        this.mappings.set("PUT /item", new PutItemApi(this.db));
        this.mappings.set("DELETE /item", new DeleteItemApi(this.db));
        this.mappings.set("GET /item/{item}", new GetItemApi(this.db));
        this.mappings.set("GET /item/location/{location}", new GetItemByLocationApi(this.db));

        this.mappings.set("GET /item-record", new GetAllItemRecordApi(this.db));
        this.mappings.set("DELETE /item-record", new DeleteItemRecordApi(this.db));
        this.mappings.set("GET /item-record/{itemrecord}", new GetItemRecordApi(this.db));
        this.mappings.set("GET /item-record/item/{itemId}", new GetItemRecordByItemApi(this.db));

        this.mappings.set("GET /inventory-plan", new GetAllInventoryPlanApi(this.db));
        this.mappings.set("POST /inventory-plan", new PostInventoryPlanApi(this.db));
        this.mappings.set("PUT /inventory-plan", new PutInventoryPlanApi(this.db));
        this.mappings.set("DELETE /inventory-plan", new DeleteInventoryPlanApi(this.db));
        this.mappings.set("GET /inventory-plan/{inventoryplan}", new GetInventoryPlanApi(this.db));
        this.mappings.set("GET /inventory-plan/location/{location}", new GetInventoryPlanByLocationApi(this.db));

        this.mappings.set("GET /transfer-plan", new GetAllTransferPlanApi(this.db));
        this.mappings.set("POST /transfer-plan", new PostTransferPlanApi(this.db));
        this.mappings.set("PUT /transfer-plan", new PutTransferPlanApi(this.db));
        this.mappings.set("DELETE /transfer-plan", new DeleteTransferPlanApi(this.db));
        this.mappings.set("GET /transfer-plan/{location}", new GetTransferPlanByLocationApi(this.db));
        this.mappings.set("GET /transfer-plan/takes/{location}", new GetTransferPlanByTakeLocationApi(this.db));
        this.mappings.set("GET /transfer-plan/gives/{location}", new GetTransferPlanByGiveLocationApi(this.db));

        this.mappings.set("GET /projection/future-date/{item}", new GetFutureDateApi(this.db));
        this.mappings.set("GET /projection/{item}", new GetProjectionApi(this.db));

        this.mappings.set("GET /exception", new GetExceptionApi(this.db));
        this.mappings.set("GET /exception/item/{item}", new GetExceptionByItemApi(this.db));
        this.mappings.set("GET /exception/location/{location}", new GetExceptionByLocationApi(this.db));

        this.mappings.set("GET /graph", new GetGraphApi(this.db));
    }

    async execute(
        httpMethod: string,
        resource: string,
        path: string,
        body: string | null,
        headers: APIGatewayProxyEventHeaders,
        queryStringParameters: APIGatewayProxyEventQueryStringParameters | null
    ): Promise<ApiResponse> {
        this.logger.info(`Received request for ${httpMethod}, ${resource}, ${path}`);
        try {
            await this.setup();
            if (!this.validateAcceptedMethods(httpMethod)) {
                return apiResponses._405(httpMethod);
            }
            this.logger.debug(`Headers: ${JSON.stringify(headers, null, 2)}`);
            if (!this.validateContentType(headers)) {
                return apiResponses._400({ message: "Content-Type must be application/json" });
            }
            const api = <ApiInterface>this.mappings.get(`${httpMethod} ${resource}`);
            const result = await api.execute(path, body, headers, queryStringParameters);
            this.logger.debug(`API Response Body: ${result.body}`);
            await this.db.close();
            return result;
        } catch (_e) {
            let e = _e;
            if (_e instanceof Error) {
                e = _e.message;
            }

            this.logger.error(e);

            await this.db.close();

            if (e === PROPERTIES_ERROR || e === UNEXPECTED_PROPERTIES_ERROR) {
                return apiResponses._400({ message: e });
            }

            const errorBody = {
                message: "Encountered internal error"
            };
            return apiResponses._500(errorBody);
        }
    }

    private validateAcceptedMethods(httpMethod: string): boolean {
        if (this.acceptedMethods.find(method => method === httpMethod) === undefined) {
            return false;
        }
        return true;
    }

    private validateContentType(headers: APIGatewayProxyEventHeaders): boolean {
        const contentType = getParameterCaseInsensitive(headers, "content-type");
        if (contentType !== undefined && contentType.indexOf("application/json") === -1) {
            return false;
        }

        return true;
    }
}
