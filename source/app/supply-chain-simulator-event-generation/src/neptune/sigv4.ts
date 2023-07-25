// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import aws4 = require("aws4");
import { API_METRICS_HEADER_KEY } from "api/apiMetrics";
import fetch, { RequestInit, Response } from "node-fetch";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { AwsCredentialIdentityProvider, AwsCredentialIdentity } from "@aws-sdk/types";

const FORBIDDEN = 403;
const UNAUTHORIZED = 401;

export class SigV4 {
    credentials: AwsCredentialIdentity;
    region: string | undefined;

    private async setCredentials(): Promise<void> {
        this.region = process.env.REGION;
        if (this.region == undefined) {
            throw new Error("Must define environment variable REGION");
        }

        const credentialsProvider: AwsCredentialIdentityProvider = fromNodeProviderChain({
            clientConfig: { region: this.region }
        });
        this.credentials = await credentialsProvider();
    }

    public async sendSignedRequest(
        host: string,
        port: number,
        path: string,
        options: RequestInit,
        apiMetricsKey: string
    ): Promise<Response> {
        if (this.credentials === undefined) {
            await this.setCredentials();
        }

        const signedOptions: aws4.Request = {
            method: options.method,
            host: host,
            port: port,
            path: path,
            region: this.region,
            service: "neptune-db",
            headers: {
                [API_METRICS_HEADER_KEY]: apiMetricsKey
            }
        };

        aws4.sign(signedOptions, {
            accessKeyId: this.credentials.accessKeyId,
            secretAccessKey: this.credentials.secretAccessKey,
            sessionToken: this.credentials.sessionToken
        });

        // Have to pass along headers like this so the signing remains un-malformed
        // No way to convert without making auth header malformed. Alternative
        // would be to use "https" library instead of node-fetch
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        options.headers = signedOptions.headers;

        let response = await fetch(`https://${signedOptions.host}:${signedOptions.port}${signedOptions.path}`, options);

        if (response.status === FORBIDDEN || response.status === UNAUTHORIZED) {
            await this.setCredentials();
            response = await fetch(`https://${signedOptions.host}:${signedOptions.port}${signedOptions.path}`, options);
        }

        return response;
    }
}
