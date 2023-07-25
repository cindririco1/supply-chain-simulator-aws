// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { APIGatewayProxyResult } from "aws-lambda";

export class ApiResponse implements APIGatewayProxyResult {
    statusCode: number;
    headers: {
        [header: string]: boolean | number | string;
    };
    body: string;

    constructor(
        statusCode: number,
        headers: {
            [header: string]: boolean | number | string;
        },
        body: string
    ) {
        this.statusCode = statusCode;
        this.headers = headers;
        this.body = body;
    }
}
