// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CloudFormationClient, DescribeStacksCommand } from "@aws-sdk/client-cloudformation";
import { fromIni, fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { Config } from "../util/config";

export class CfProxy {
    private readonly stackName: string;
    private readonly client: CloudFormationClient;

    constructor(config: Config) {
        this.stackName = config.stackName;
        const credentials =
            config.profile != undefined ? fromIni({ profile: config.profile }) : fromNodeProviderChain();
        this.client = new CloudFormationClient({
            credentials: credentials,
            region: config.region
        });
    }

    /**
     * Fetch the ApiGateway endpoint url from the CloudFormation stack.
     */
    public async getApiEndpoint(): Promise<string> {
        return await this.getStackOutput("ApiConstructCognitoApiGatewayLambdaRestApiEndpoint");
    }

    /**
     * Fetch the user pool id from the CloudFormation stack.
     */
    public async getUserPoolId(): Promise<string> {
        return await this.getStackOutput("UserPoolId");
    }

    /**
     * Fetch the client id from the CloudFormation stack.
     */
    public async getClientId(): Promise<string> {
        return await this.getStackOutput("ClientId");
    }

    /**
     * Fetch the schedule group name for the CloudFormation stack.
     * @returns schedule group name for deployment
     */
    public async getScheduleGroupName(): Promise<string> {
        return await this.getStackOutput("ScheduleGroupName");
    }

    /**
     * Fetch the plan exec's lambda name from the CloudFormation stack.
     */
    public async getPlanExecutionLambdaName(): Promise<string> {
        return await this.getStackOutput("PlanExecutionLambdaName");
    }

    private async getStackOutput(outputName: string): Promise<string> {
        const command = new DescribeStacksCommand({
            StackName: this.stackName
        });
        const response = await this.client.send(command);

        const stack = response.Stacks?.find(s => s.StackName === this.stackName);
        if (stack === undefined) {
            throw Error(`Unable to find stack with name: ${this.stackName}`);
        }

        const output = stack.Outputs?.find(o => o.OutputKey?.startsWith(outputName));

        if (output === undefined) {
            throw Error(`Unable to find output, avaliable outputs: ${stack.Outputs}`);
        }

        return output.OutputValue!;
    }
}
