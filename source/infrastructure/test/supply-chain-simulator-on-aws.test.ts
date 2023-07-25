// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { SupplyChainSimulatorOnAWSStack } from "../lib/supply-chain-simulator-on-aws-solution-stack";

test("Stream Poller Service created", () => {
    const solutionId = "SO0070";
    const solutionBucketName = "test-bucket";
    const solutionName = "SupplyChainSimulatorOnAWS";
    const solutionVersion = "vTest";
    const apiMetricsKey = `AWSSOLUTION/${solutionId}/${solutionVersion}`;
    const ecrRegistry = "someRegistry";
    const ecrTag = "someTag";

    const app = new cdk.App();
    const stack = new SupplyChainSimulatorOnAWSStack(app, "TestStack", {
        env: {
            region: process.env.REGION
        },
        solutionBucketName,
        solutionId,
        solutionName,
        solutionVersion,
        apiMetricsKey,
        ecrRegistry,
        ecrTag
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::ECS::Cluster", {});
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
        ContainerDefinitions: [
            {
                Essential: true,
                Image: "someRegistry/supply-chain-simulator-event-generation:someTag"
            }
        ]
    });
});
