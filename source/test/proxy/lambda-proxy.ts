// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { fromIni, fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { Config } from "../util/config";
import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

export class LambdaProxy {
    private readonly client: LambdaClient;

    constructor(config: Config) {
        const credentials =
            config.profile != undefined ? fromIni({ profile: config.profile }) : fromNodeProviderChain();
        this.client = new LambdaClient({
            credentials: credentials,
            region: config.region
        });
    }

    /**
     * Invoke the lambda with a customized payload in direct json format.
     */
    public async invoke(functionName: string, payloadJson: object) {
        const payload = Buffer.from(JSON.stringify(payloadJson));
        const command = new InvokeCommand({
            FunctionName: functionName,
            Payload: payload
        });
        return await this.client.send(command);
    }
}
