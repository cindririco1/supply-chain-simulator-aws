// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { addCfnSuppressRules } from "@aws-solutions-constructs/core";
import { Aws } from "aws-cdk-lib";
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import {
    AwsLogDriver,
    AwsLogDriverMode,
    Cluster,
    ContainerImage,
    FargateService,
    FargateTaskDefinition
} from "aws-cdk-lib/aws-ecs";
import { PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { ApiMetricsConstructProps, API_METRICS_SOLUTION_ID_ENV_KEY } from "../../../shared/api/apiMetrics";

export interface StreamPollerConstructProps extends ApiMetricsConstructProps {
    readonly cluster: Cluster;
    readonly calculationServiceQueue: Queue;
    readonly planExecutionQueue: Queue;
    readonly streamPollerContainerImage: string;
    readonly ingressSecurityGroup: SecurityGroup;
    readonly neptuneEndpoint: string;
    readonly neptunePort: number;
    readonly neptuneClusterArn: string;
}

export class StreamPollerConstruct extends Construct {
    constructor(scope: Construct, id: string, props: StreamPollerConstructProps) {
        super(scope, id);

        const streamPollerTaskRole = new Role(this, "StreamPollerTaskRole", {
            assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
            inlinePolicies: {
                taskExecution: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: ["neptune-db:GetStreamRecords"],
                            resources: [`${props.neptuneClusterArn}/*`]
                        }),
                        new PolicyStatement({
                            actions: ["sqs:SendMessage"],
                            resources: [props.calculationServiceQueue.queueArn, props.planExecutionQueue.queueArn]
                        })
                    ]
                })
            }
        });

        NagSuppressions.addResourceSuppressions(
            streamPollerTaskRole,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: "AWS documentation shows that to interact with a cluster, you append a wildcard to the cluster ARN"
                }
            ],
            true
        );

        const streamPollerTaskExecutionRole = new Role(this, "StreamPollerTaskExecutionRole", {
            assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
            inlinePolicies: {
                taskExecution: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
                            resources: ["*"]
                        }),
                        new PolicyStatement({
                            actions: [
                                "ecr:GetAuthorizationToken",
                                "ecr:GetDownloadUrlForLayer",
                                "ecr:BatchGetImage",
                                "ecr:BatchCheckLayerAvailability",
                                "ecr:PutImage",
                                "ecr:InitiateLayerUpload",
                                "ecr:UploadLayerPart",
                                "ecr:CompleteLayerUpload"
                            ],
                            resources: ["*"]
                        })
                    ]
                })
            }
        });

        NagSuppressions.addResourceSuppressions(
            streamPollerTaskExecutionRole,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: "Has to be able to create any type of log group, and pull any ECR image (for now)"
                }
            ],
            true
        );
        addCfnSuppressRules(streamPollerTaskExecutionRole, [
            {
                id: "W11",
                reason: "Has to be able to create any type of log group, and pull any ECR image (for now)"
            }
        ]);

        const fargateTaskDefinition = new FargateTaskDefinition(this, "StreamPollerTaskDefinition", {
            memoryLimitMiB: 1024,
            cpu: 512,
            taskRole: streamPollerTaskRole,
            executionRole: streamPollerTaskExecutionRole
        });
        const logGroup = new LogGroup(this, "streamPollerLogGroup", {
            retention: RetentionDays.TWO_YEARS
        });
        addCfnSuppressRules(logGroup, [
            { id: "W84", reason: "LogGroups are by default encrypted server side by CloudWatch Logs Service" }
        ]);
        fargateTaskDefinition.addContainer("StreamPollerContainer", {
            image: ContainerImage.fromRegistry(props.streamPollerContainerImage),
            environment: {
                TIME_INTERVAL: "500", // costs for querying more frequently is negligible
                NEPTUNE_ENDPOINT: props.neptuneEndpoint,
                NEPTUNE_STREAM_PAGE_SIZE: "1000",
                NEPTUNE_PORT: String(props.neptunePort),
                CALCULATION_SERVICE_QUEUE_URL: props.calculationServiceQueue.queueUrl,
                PLAN_EXECUTION_QUEUE_URL: props.planExecutionQueue.queueUrl,
                REGION: Aws.REGION,
                [API_METRICS_SOLUTION_ID_ENV_KEY]: props.apiMetricsKey
            },
            logging: new AwsLogDriver({
                streamPrefix: "StreamPoller",
                mode: AwsLogDriverMode.NON_BLOCKING,
                logGroup: logGroup
            })
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
        const streamPollerService = new FargateService(this, "StreamPoller", { // NOSONAR: typescript:S1854
            cluster: props.cluster,
            desiredCount: 1,
            taskDefinition: fargateTaskDefinition,
            securityGroups: [props.ingressSecurityGroup]
        });

        NagSuppressions.addResourceSuppressions(
            fargateTaskDefinition,
            [
                {
                    id: "AwsSolutions-ECS2",
                    reason: "We want to directly specify a container definition because we don't want a load balancer, the app itself is generating the events"
                }
            ],
            true
        );
    }
}
