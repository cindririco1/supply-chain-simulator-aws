// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { APIGatewayProxyEventHeaders, APIGatewayProxyEventQueryStringParameters } from "aws-lambda";
import { ApiResponse } from "./api-response";

function getHeaders(): { [header: string]: boolean | number | string } {
    const allowOrigin = process.env.ALLOW_ORIGIN || "*";
    return {
        "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Access-Control-Allow-Origin": `${allowOrigin}`
    };
}

export const apiResponses = {
    _200: (body: { [key: string]: any }) => {
        return new ApiResponse(200, getHeaders(), JSON.stringify(body, null, 2));
    },
    _400: (body: { [key: string]: any }) => {
        return new ApiResponse(400, getHeaders(), JSON.stringify(body, null, 2));
    },
    _404: (body?: string) => {
        return new ApiResponse(404, getHeaders(), body ?? "");
    },
    _405: (httpMethod: string) => {
        return new ApiResponse(405, getHeaders(), JSON.stringify({ message: `HTTP method ${httpMethod} not accepted` }, null, 2));  
    },
    _500: (body: { [key: string]: any }) => {
        return new ApiResponse(500, getHeaders(), JSON.stringify(body, null, 2));
    }
};

export interface ApiInterface {
    execute(
        path: string,
        body: string | null,
        headers: APIGatewayProxyEventHeaders,
        queryStringParameters: APIGatewayProxyEventQueryStringParameters | null
    ): Promise<ApiResponse>;
}
