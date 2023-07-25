// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Aws, CustomResource, Duration } from "aws-cdk-lib";
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Function, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { ApiMetricsConstructProps } from "../../../shared/api/apiMetrics";

export interface GeneralCustomResourcesConstructProps extends ApiMetricsConstructProps {
    readonly sourceCodeBucket: IBucket;
    readonly sourceCodePrefix: string;
    readonly scheduleGroupName: string;
    readonly solutionId: string;
    readonly solutionVersion: string;
    readonly shouldSendOperationalMetrics: boolean;
}

export class GeneralCustomResourcesConstruct extends Construct {
    generalCustomResourceFunctionArn: string;
    solutionUUID: string;

    constructor(scope: Construct, id: string, props: GeneralCustomResourcesConstructProps) {
        super(scope, id);

        const generalCustomResourceRole = new Role(this, "GeneralCustomResourceRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            inlinePolicies: {
                LambdaFunctionServiceRolePolicy: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                            resources: [
                                `arn:${Aws.PARTITION}:logs:${Aws.REGION}:${Aws.ACCOUNT_ID}:log-group:/aws/lambda/*`
                            ]
                        }),
                        new PolicyStatement({
                            actions: ["s3:GetObject"],
                            resources: [`${props.sourceCodeBucket.bucketArn}`, `${props.sourceCodeBucket.bucketArn}/*`]
                        }),
                        new PolicyStatement({
                            sid: "SchedulerGroupAccess",
                            actions: ["scheduler:DeleteScheduleGroup"],
                            effect: Effect.ALLOW,
                            resources: [
                                `arn:aws:scheduler:${Aws.REGION}:${Aws.ACCOUNT_ID}:schedule-group/${props.scheduleGroupName}*`
                            ]
                        }),
                        new PolicyStatement({
                            sid: "SchedulerAccess",
                            actions: ["scheduler:DeleteSchedule"],
                            effect: Effect.ALLOW,
                            resources: [
                                `arn:aws:scheduler:${Aws.REGION}:${Aws.ACCOUNT_ID}:schedule/${props.scheduleGroupName}*`
                            ]
                        })
                    ]
                })
            }
        });

        NagSuppressions.addResourceSuppressions(
            generalCustomResourceRole,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: "Need wildcard for cloudwatch logs, bucket wildcard is scoped to prefix, schedule wildcard is scoped to group"
                }
            ],
            true
        );

        const generalCustomResourceFunction = new Function(this, "GeneralCustomResourceFunction", {
            runtime: Runtime.NODEJS_18_X,
            code: Code.fromBucket(props.sourceCodeBucket, `${props.sourceCodePrefix}/custom-resource-handlers.zip`),
            handler: "general-custom-resources/index.handler",
            memorySize: 256,
            timeout: Duration.minutes(15),
            reservedConcurrentExecutions: 1,
            environment: {
                API_METRICS_SOLUTION_ID_ENV_KEY: props.apiMetricsKey
            },
            role: generalCustomResourceRole
        });

        const teardownEventbridgeSchedulesCustomResource = new CustomResource( // NOSONAR: typescript:S1854
            this,
            "TeardownEventbridgeSchedulesCustomResource",
            {
                serviceToken: generalCustomResourceFunction.functionArn,
                properties: {
                    Resource: "DELETE_EVENTBRIDGE_SCHEDULES",
                    GroupName: props.scheduleGroupName,
                    Region: Aws.REGION
                }
            }
        );

        const customUuid = new CustomResource(this, "UUID", {
            serviceToken: generalCustomResourceFunction.functionArn,
            properties: {
                Resource: "CREATE_UUID"
            }
        });
        this.solutionUUID = customUuid.getAtt("UUID").toString();

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
        const sendOperationalMetricsCustomResource = new CustomResource(this, "SendOperationalMetricsCustomResource", { // NOSONAR: typescript:S1848
            serviceToken: generalCustomResourceFunction.functionArn,
            properties: {
                Resource: "SEND_OPERATIONAL_METRICS",
                Region: Aws.REGION,
                ShouldSend: props.shouldSendOperationalMetrics,
                SolutionId: props.solutionId,
                SolutionVersion: props.solutionVersion,
                SolutionUUID: this.solutionUUID
            }
        });
    }
}
