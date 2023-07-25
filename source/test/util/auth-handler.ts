// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    AuthFlowType,
    CognitoIdentityProviderClient,
    AdminInitiateAuthCommand,
    InitiateAuthCommand
} from "@aws-sdk/client-cognito-identity-provider";
import { fromIni } from "@aws-sdk/credential-providers";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { CfProxy } from "../proxy/cf-proxy";
import { Config } from "./config";

export class AuthHandler {
    refreshToken: string;
    client: CognitoIdentityProviderClient;
    retries: number;
    maxRetries: number;
    config: Config;
    cfProxy: CfProxy;
    userPoolId: string;
    clientId: string;

    constructor(config: Config, cfProxy: CfProxy) {
        const credentials =
            config.profile != undefined ? fromIni({ profile: config.profile }) : fromNodeProviderChain();

        this.client = new CognitoIdentityProviderClient({
            region: config.region,
            credentials: credentials
        });
        this.maxRetries = 10;
        this.config = config;
        this.cfProxy = cfProxy;
    }

    public async getToken(): Promise<string> {
        if (this.userPoolId == undefined) {
            this.userPoolId = await this.cfProxy.getUserPoolId();
        }

        if (this.clientId == undefined) {
            this.clientId = await this.cfProxy.getClientId();
        }

        if (this.refreshToken == undefined) {
            this.refreshToken = await this.getRefreshToken();
        }

        const command = new InitiateAuthCommand({
            ClientId: this.clientId,
            AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
            AuthParameters: {
                REFRESH_TOKEN: this.refreshToken
            }
        });

        const response = await this.client.send(command);

        if (response.AuthenticationResult?.IdToken) {
            return response.AuthenticationResult?.IdToken;
        } else if (this.retries < this.maxRetries) {
            this.retries++;
            this.refreshToken = await this.getRefreshToken();
            return await this.getToken();
        } else {
            throw Error("Couldn't get valid token after retrying");
        }
    }

    private async getRefreshToken(): Promise<string> {
        const command = new AdminInitiateAuthCommand({
            ClientId: this.clientId,
            UserPoolId: this.userPoolId,
            // see here: https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-authentication-flow.html#amazon-cognito-user-pools-server-side-authentication-flow
            AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
            AuthParameters: {
                USERNAME: this.config.username,
                PASSWORD: this.config.password
            }
        });

        const response = await this.client.send(command);
        if (response.AuthenticationResult?.RefreshToken) {
            return response.AuthenticationResult?.RefreshToken;
        } else {
            throw Error("No refresh token found after login");
        }
    }
}
