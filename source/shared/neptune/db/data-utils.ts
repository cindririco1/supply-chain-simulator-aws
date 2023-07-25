// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// adding aws4 types and using import fails
const aws4 = require("aws4");

import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { API_METRICS_HEADER_KEY, API_METRICS_SOLUTION_ID_ENV_KEY } from "api/apiMetrics";
import { OutgoingHttpHeaders } from "http2";

export interface NeptuneConnectionInfo {
    url: string;
    headers: OutgoingHttpHeaders;
}

interface Credentials {
    accessKey?: string;
    accessKeyId?: string;
    secretKey?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    region?: string;
}

/**
 *
 * @param useIAM
 */
export async function getDBHostString(useIAM: boolean): Promise<NeptuneConnectionInfo> {
    if (process.env["NEPTUNE_ENDPOINT"] === undefined) {
        throw new Error("Env variable NEPTUNE_ENDPOINT not found");
    }
    if (process.env["NEPTUNE_PORT"] === undefined) {
        throw new Error("Env variable NEPTUNE_PORT not found");
    }
    if (process.env[API_METRICS_SOLUTION_ID_ENV_KEY] === undefined) {
        throw new Error(`Env variable ${API_METRICS_SOLUTION_ID_ENV_KEY} not found`);
    }

    let url: string = "";
    let headers: {} = {};
    if (useIAM === true) {
        const credentialprovider = fromNodeProviderChain();
        const credentials = await credentialprovider();
        const options = {
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            sessionToken: credentials.sessionToken
        };

        ({ url, headers } = getUrlAndHeaders(
            process.env["NEPTUNE_ENDPOINT"],
            process.env["NEPTUNE_PORT"],
            options,
            "/gremlin",
            "wss",
            process.env[API_METRICS_SOLUTION_ID_ENV_KEY]
        ));
    } else {

        let protocolPrefix = "wss";
        if (process.env["LOCAL_MODE"]) {
            protocolPrefix = "ws";
        }

        url = `${protocolPrefix}://` + process.env["NEPTUNE_ENDPOINT"] + ":" + process.env["NEPTUNE_PORT"] + "/gremlin";
    }

    return { url, headers };
}

function getUrlAndHeaders(
    host: string,
    port: string,
    credentials: Credentials,
    canonicalUri: string,
    protocol: string,
    apiMetricsKey: string
): NeptuneConnectionInfo {
    if (!host || !port) {
        throw new Error("Host and port are required");
    }
    const accessKeyId = credentials.accessKey || credentials.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = credentials.secretKey || credentials.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
    const sessionToken = credentials.sessionToken || process.env.AWS_SESSION_TOKEN;
    const region = credentials.region || process.env.AWS_DEFAULT_REGION;

    if (!accessKeyId || !secretAccessKey) {
        throw new Error("Access key and secret key are required");
    }

    const awsCreds = { accessKeyId, secretAccessKey, sessionToken };
    const sigOptions = {
        host: `${host}:${port}`,
        region,
        path: canonicalUri,
        service: "neptune-db",
        headers: {
            [API_METRICS_HEADER_KEY]: apiMetricsKey
        }
    };

    return {
        url: `${protocol}://${host}:${port}${canonicalUri}`,
        headers: aws4.sign(sigOptions, awsCreds).headers
    };
}
