// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Context, APIGatewayProxyResult, APIGatewayEvent } from "aws-lambda";
import { NeptuneIntegratorApi } from "./api/neptune-integrator-api";

export const lambdaHandler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const { body, headers, httpMethod, path, queryStringParameters, resource } = event;

    const neptuneIntegratorApi = new NeptuneIntegratorApi();

    return neptuneIntegratorApi.execute(httpMethod, resource, path, body, headers, queryStringParameters);
};
