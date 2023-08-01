// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as cdk from "@aws-cdk/core";
import { Aws, CfnOutput, CfnParameter, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiMetricsConstructProps } from "../../shared/api/apiMetrics";

import { ApiConstruct } from "./api/api-construct";
import { applyAppRegistry } from "./appregistry/application-resource";
import { CalculationConstruct } from "./calculation/calculation-construct";
import { SourceBucketConstruct } from "./common/source-bucket";
import { ECSClusterConstruct } from "./ecs/ecs-cluster-construct";
import { NeptuneConstruct } from "./neptune/neptune-construct";
import { PlanExecutionConstruct } from "./plan-execution/plan-execution-construct";
import { StreamPollerConstruct } from "./streampoller/stream-poller-construct";
import { UIConstruct } from "./ui/ui-construct";
import { UICustomResourceConstruct } from "./ui/ui-custom-resource-construct";
import { VpcConstruct } from "./vpc/vpc-construct";
import { GeneralCustomResourcesConstruct } from "./general-custom-resources/general-custom-resources";
export enum EnvironmentType {
    PRODUCTION = "prod",
    DEVELOPMENT = "dev"
}
export enum NeptuneDbInstanceClassTypes {
    R6G_LARGE = "R6G_LARGE",
    R6G_XLARGE = "R6G_XLARGE",
    R6G_2XLARGE = "R6G_2XLARGE",
    R6G_4XLARGE = "R6G_4XLARGE",
    R6G_8XLARGE = "R6G_8XLARGE",
    R6G_12XLARGE = "R6G_12XLARGE",
    R6G_16XLARGE = "R6G_16XLARGE",
    T4G_MEDIUM = "T4G_MEDIUM",
    R5_LARGE = "R5_LARGE",
    R5_XLARGE = "R5_XLARGE",
    R5_2XLARGE = "R5_2XLARGE",
    R5_4XLARGE = "R5_4XLARGE",
    R5_8XLARGE = "R5_8XLARGE",
    R5_12XLARGE = "R5_12XLARGE",
    R5_24XLARGE = "R5_24XLARGE",
    R4_LARGE = "R4_LARGE",
    R4_XLARGE = "R4_XLARGE",
    R4_2XLARGE = "R4_2XLARGE",
    R4_4XLARGE = "R4_4XLARGE",
    R4_8XLARGE = "R4_8XLARGE",
    T3_MEDIUM = "T3_MEDIUM"
}

export interface SolutionProps extends StackProps, ApiMetricsConstructProps {
    readonly solutionBucketName: string;
    readonly solutionId: string;
    readonly solutionName: string;
    readonly solutionVersion: string;
    readonly apiMetricsKey: string;
    readonly ecrRegistry: string;
    readonly ecrTag: string;
}

export class SupplyChainSimulatorOnAWSStack extends Stack {
    constructor(scope: Construct, id: string, props: SolutionProps) {
        super(scope, id, props);

        const databasePort = Number(this.node.tryGetContext("DatabasePort"));

        const databaseInstanceSize = this.node.tryGetContext("DatabaseSize");

        const adminEmailParameter = new CfnParameter(this, "AdminEmail", {
            type: "String",
            description: "The admin email address to use for Cognito and QuickSight",
            constraintDescription: "Must be a valid email address",
            minLength: 7,
            maxLength: 320, // Maximum length of an email address
            allowedPattern: "^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-.]+$" // Regex for valid email address
        });

        const environmentParameter = new CfnParameter(this, "Environment", {
            type: "String",
            description: "The type of service environment, either development or production",
            constraintDescription: "Must be a dev or prod",
            allowedValues: Object.values(EnvironmentType),
            default: EnvironmentType.DEVELOPMENT
        });

        const shouldSendAnonymizedMetrics = new CfnParameter(this, "ShouldSendAnonymizedMetrics", {
            type: "String",
            description: "Whether or not to send anonymous metrics to AWS to help improve the solution",
            constraintDescription: "Must be true or false",
            allowedValues: ["true", "false"],
            default: "true"
        });

        const databaseBackupRetentionDays = new CfnParameter(this, "DatabaseBackupRetentionDays", {
            type: "Number",
            description: "How many days to keep database backups",
            minValue: 15,
            default: 15
        });

        const vpcConstruct = new VpcConstruct(this, "VPCConstruct", {
            databasePort
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
        const neptuneConstruct = new NeptuneConstruct(this, "NeptuneConstruct", { // NOSONAR: typescript:S1848
            vpc: vpcConstruct.vpc,
            databasePort: databasePort,
            databaseSecurityGroup: vpcConstruct.databaseSecurityGroup,
            environment: environmentParameter.valueAsString,
            databaseInstanceSize: databaseInstanceSize,
            minAutoscalingInstances: 1,
            maxAutoscalingInstances: 4,
            databaseBackupRetentionDays: databaseBackupRetentionDays.valueAsNumber
        });

        const sourceCode = new SourceBucketConstruct(this, "SourceBucket", {
            sourceCodeBucketName: `${props.solutionBucketName}-${Aws.REGION}`
        });
        const sourceCodeBucket = sourceCode.sourceCodeBucket;
        const sourceCodePrefix = `${props.solutionName}/${props.solutionVersion}`;

        const planExecutionConstruct = new PlanExecutionConstruct(this, "PlanExecutionConstruct", {
            vpc: vpcConstruct.vpc,
            ingressSecurityGroup: vpcConstruct.ingressSecurityGroup,
            sourceCodeBucket: sourceCodeBucket,
            sourceCodePrefix: sourceCodePrefix,
            neptuneEndpoint: neptuneConstruct.neptuneEndpoint,
            neptunePort: Number(neptuneConstruct.neptunePort),
            neptuneClusterArn: neptuneConstruct.neptuneClusterArn,
            apiMetricsKey: props.apiMetricsKey,
            stackName: cdk.Stack.of(this).stackName
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const generalCustomResourcesConstruct = new GeneralCustomResourcesConstruct( // NOSONAR: typescript:S1848
            this,
            "GeneralCustomResourcesConstruct",
            {
                sourceCodeBucket: sourceCodeBucket,
                sourceCodePrefix: sourceCodePrefix,
                scheduleGroupName: planExecutionConstruct.scheduleGroupName,
                apiMetricsKey: props.apiMetricsKey,
                solutionId: props.solutionId,
                solutionVersion: props.solutionVersion,
                shouldSendOperationalMetrics: Boolean(shouldSendAnonymizedMetrics.valueAsString)
            }
        );

        const uiConstruct = new UIConstruct(this, "UIConstruct", {
            environment: environmentParameter.valueAsString,
            solutionUUID: generalCustomResourcesConstruct.solutionUUID
        });

        const apiConstruct = new ApiConstruct(this, "ApiConstruct", {
            email: adminEmailParameter.valueAsString,
            vpc: vpcConstruct.vpc,
            ingressSecurityGroup: vpcConstruct.ingressSecurityGroup,
            sourceCodeBucket: sourceCodeBucket,
            sourceCodePrefix: sourceCodePrefix,
            neptuneClusterArn: neptuneConstruct.neptuneClusterArn,
            distributionDomainName: uiConstruct.distributionDomainName,
            apiMetricsKey: props.apiMetricsKey,
            neptuneEndpoint: neptuneConstruct.neptuneEndpoint,
            neptunePort: neptuneConstruct.neptunePort
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
        const uiCustomResourceConstruct = new UICustomResourceConstruct(this, "UICustomResourceConstruct", { // NOSONAR: typescript:S1848 typescript:S1848
            apiEndpoint: apiConstruct.apiGatewayUrl,
            awsRegion: process.env.REGION || "us-east-1",
            userPoolId: apiConstruct.userPoolId,
            userPoolClientId: apiConstruct.userPoolClientId,
            sourceCodeBucket: sourceCodeBucket,
            sourceCodePrefix: sourceCodePrefix,
            destinationCodeBucket: uiConstruct.s3Bucket,
            vpc: vpcConstruct.vpc,
            uiBuckets: uiConstruct.buckets
        });

        const ecsClusterConstruct = new ECSClusterConstruct(this, "ECSClusterConstruct", {
            vpc: vpcConstruct.vpc
        });

        const calculationConstruct = new CalculationConstruct(this, "CalculationConstruct", {
            cluster: ecsClusterConstruct.cluster,
            calculationServiceContainerImage: `${props.ecrRegistry}/supply-chain-simulator-calculation:${props.ecrTag}`,
            ingressSecurityGroup: vpcConstruct.ingressSecurityGroup,
            neptuneEndpoint: neptuneConstruct.neptuneEndpoint,
            neptunePort: Number(neptuneConstruct.neptunePort),
            neptuneClusterArn: neptuneConstruct.neptuneClusterArn,
            apiMetricsKey: props.apiMetricsKey
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
        const streamPollerConstruct = new StreamPollerConstruct(this, "StreamPollerConstruct", { // NOSONAR: typescript:S1848 typescript:S1848
            cluster: ecsClusterConstruct.cluster,
            calculationServiceQueue: calculationConstruct.calculationServiceQueue,
            planExecutionQueue: planExecutionConstruct.planExecutionQueue,
            streamPollerContainerImage: `${props.ecrRegistry}/supply-chain-simulator-event-generation:${props.ecrTag}`,
            ingressSecurityGroup: vpcConstruct.ingressSecurityGroup,
            neptuneEndpoint: neptuneConstruct.neptuneEndpoint,
            neptunePort: Number(neptuneConstruct.neptunePort),
            neptuneClusterArn: neptuneConstruct.neptuneClusterArn,
            apiMetricsKey: props.apiMetricsKey
        });

        // Register this application in App Registry
        applyAppRegistry(this, props);

        // Outputs
        // eslint-disable-next-line prettier/prettier
        new CfnOutput(this, "CloudFrontURL", { // NOSONAR: typescript:S1848 typescript:S1848
            value: uiConstruct.distributionDomainName,
            description: "The URL of CloudFront distribution"
        });

        // eslint-disable-next-line prettier/prettier
        new CfnOutput(this, "UserPoolId", { // NOSONAR: typescript:S1848 typescript:S1848
            value: apiConstruct.userPoolId,
            description: "The user pool id for the app's cognito pool"
        });

        // eslint-disable-next-line prettier/prettier
        new CfnOutput(this, "ClientId", { // NOSONAR: typescript:S1848 typescript:S1848
            value: apiConstruct.userPoolClientId,
            description: "The client id for the app's cognito pool client"
        });

        // eslint-disable-next-line prettier/prettier
        new CfnOutput(this, "PlanExecutionLambdaName", { // NOSONAR: typescript:S1848 typescript:S1848
            value: planExecutionConstruct.lambdaFunctionName,
            description: "Lambda name for plan execution, needed for integration tests"
        });

        // eslint-disable-next-line prettier/prettier
        new CfnOutput(this, "SolutionUUID", {  // NOSONAR: typescript:S1848 typescript:S1848
            value: generalCustomResourcesConstruct.solutionUUID,
            description: "Unique identifier for this deployment"
        });

        // eslint-disable-next-line prettier/prettier
        new CfnOutput(this, "ScheduleGroupName", { // NOSONAR: typescript:S1848 typescript:S1848
            value: planExecutionConstruct.scheduleGroupName,
            description: "The group name under which schedules are made in eventbridge"
        });
    }
}
