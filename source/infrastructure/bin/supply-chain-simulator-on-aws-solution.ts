#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from "aws-cdk-lib";
import { DefaultStackSynthesizer } from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import "source-map-support/register";

import { SupplyChainSimulatorOnAWSStack, SolutionProps } from "../lib/supply-chain-simulator-on-aws-solution-stack";

/**
 * Gets the solution props from the environment variables.
 *
 * @returns The solution props
 */
function getProps(): SolutionProps {
    const {
        BUCKET_NAME_PLACEHOLDER,
        SOLUTION_NAME_PLACEHOLDER,
        VERSION_PLACEHOLDER,
        PUBLIC_ECR_REGISTRY,
        PUBLIC_ECR_TAG
    } = process.env;

    if (typeof BUCKET_NAME_PLACEHOLDER !== "string" || BUCKET_NAME_PLACEHOLDER.trim() === "") {
        throw new Error("Missing required environment variable: BUCKET_NAME_PLACEHOLDER");
    }
    if (typeof SOLUTION_NAME_PLACEHOLDER !== "string" || SOLUTION_NAME_PLACEHOLDER.trim() === "") {
        throw new Error("Missing required environment variable: SOLUTION_NAME_PLACEHOLDER");
    }

    if (typeof VERSION_PLACEHOLDER !== "string" || VERSION_PLACEHOLDER.trim() === "") {
        throw new Error("Missing required environment variable: VERSION_PLACEHOLDER");
    }

    if (typeof PUBLIC_ECR_REGISTRY !== "string" || PUBLIC_ECR_REGISTRY.trim() === "") {
        throw Error("PUBLIC_ECR_REGISTRY is missing.");
    }

    if (typeof PUBLIC_ECR_TAG !== "string" || PUBLIC_ECR_TAG.trim() === "") {
        throw Error("PUBLIC_ECR_TAG is missing.");
    }

    const solutionBucketName = `${BUCKET_NAME_PLACEHOLDER}`;
    const solutionId = "SO0234";
    const solutionName = SOLUTION_NAME_PLACEHOLDER;
    const solutionVersion = VERSION_PLACEHOLDER;
    const description = `(${solutionId}) - ${solutionName} Version ${solutionVersion}`;
    const apiMetricsKey = `AWSSOLUTION/${solutionId}/${solutionVersion}`;
    const ecrRegistry = PUBLIC_ECR_REGISTRY;
    const ecrTag = PUBLIC_ECR_TAG;

    return {
        description,
        solutionBucketName,
        solutionId,
        solutionName,
        solutionVersion,
        apiMetricsKey,
        ecrRegistry,
        ecrTag
    };
}

const app = new cdk.App();
// eslint-disable-next-line no-new, prettier/prettier
new SupplyChainSimulatorOnAWSStack(app, process.env.DEPLOYED_STACK_NAME || "SupplyChainSimulatorOnAWS", { // NOSONAR: typescript:S1848
    synthesizer: new DefaultStackSynthesizer({
        generateBootstrapVersionRule: false
    }),
    ...getProps()
});

cdk.Aspects.of(app).add(new AwsSolutionsChecks());
