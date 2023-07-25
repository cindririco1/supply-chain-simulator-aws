// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class Config {
    accountId: number;
    region: string;
    stackName: string;
    username: string;
    password: string;
    profile: string;

    constructor() {
        if (process.env.AWS_ACCOUNT_ID) {
            this.accountId = Number(process.env.AWS_ACCOUNT_ID);
        } else {
            throw new Error("Environment variable AWS_ACCOUNT_ID must be set");
        }

        if (process.env.REGION) {
            this.region = String(process.env.REGION);
        } else {
            throw new Error("Environment variable REGION must be set");
        }

        if (process.env.PROFILE) {
            this.profile = String(process.env.PROFILE);
        }

        if (process.env.DEPLOYED_STACK_NAME) {
            this.stackName = String(process.env.DEPLOYED_STACK_NAME);
        } else {
            throw new Error("Environment variable DEPLOYED_STACK_NAME must be set");
        }

        if (process.env.USERNAME) {
            this.username = String(process.env.USERNAME);
        } else {
            throw new Error("Environment variable USERNAME must be set");
        }

        if (process.env.PASSWORD) {
            this.password = String(process.env.PASSWORD);
        } else {
            throw new Error("Environment variable PASSWORD must be set");
        }
    }
}
