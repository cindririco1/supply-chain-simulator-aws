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
import { DeadLetterQueue, Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { ApiMetricsConstructProps, API_METRICS_SOLUTION_ID_ENV_KEY } from "../../../shared/api/apiMetrics";

export interface CalculationConstructProps extends ApiMetricsConstructProps {
    readonly cluster: Cluster;
    readonly calculationServiceContainerImage: string;
    readonly ingressSecurityGroup: SecurityGroup;
    readonly neptuneEndpoint: string;
    readonly neptunePort: number;
    readonly neptuneClusterArn: string;
}

export class CalculationConstruct extends Construct {
    calculationServiceQueue: Queue;

    constructor(scope: Construct, id: string, props: CalculationConstructProps) {
        super(scope, id);

        const calcServiceDLQ: DeadLetterQueue = {
            maxReceiveCount: 10,
            queue: new Queue(this, "CalculationServiceDLQ", {
                encryption: QueueEncryption.KMS_MANAGED,
                enforceSSL: true
            })
        };

        NagSuppressions.addResourceSuppressions(
            calcServiceDLQ.queue,
            [
                {
                    id: "AwsSolutions-SQS3",
                    reason: "This is a deadletter queue, it itself doesn't need one"
                }
            ],
            true
        );

        const calculationServiceQueue = new Queue(this, "CalculationServiceQueue", {
            encryption: QueueEncryption.KMS_MANAGED,
            deadLetterQueue: calcServiceDLQ,
            enforceSSL: true
        });
        this.calculationServiceQueue = calculationServiceQueue;

        const calculationServiceTaskRole = new Role(this, "CalculationServiceTaskRole", {
            assumedBy: new ServicePrincipal("ecs-tasks.amazonaws.com"),
            inlinePolicies: {
                taskExecution: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: [
                                "neptune-db:connect",
                                "neptune-db:ReadDataViaQuery",
                                "neptune-db:WriteDataViaQuery",
                                "neptune-db:DeleteDataViaQuery",
                                "neptune-db:GetQueryStatus",
                                "neptune-db:CancelQuery"
                            ],
                            resources: [`${props.neptuneClusterArn}/*`]
                        }),
                        new PolicyStatement({
                            actions: ["sqs:ReceiveMessage", "sqs:SendMessage", "sqs:DeleteMessage"],
                            resources: [calculationServiceQueue.queueArn]
                        }),
                        new PolicyStatement({
                            actions: ["sqs:SendMessage"],
                            resources: [calcServiceDLQ.queue.queueArn]
                        })
                    ]
                })
            }
        });

        NagSuppressions.addResourceSuppressions(
            calculationServiceTaskRole,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: "AWS documentation shows that to interact with a cluster, you append a wildcard to the cluster ARN"
                }
            ],
            true
        );

        const calculationServiceTaskExecutionRole = new Role(this, "CalculationServiceTaskExecutionRole", {
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
            calculationServiceTaskExecutionRole,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: "Has to be able to create any type of log group, and pull any ECR image (for now)"
                }
            ],
            true
        );
        addCfnSuppressRules(calculationServiceTaskExecutionRole, [
            {
                id: "W11",
                reason: "Has to be able to create any type of log group, and pull any ECR image (for now)"
            }
        ]);

        const fargateTaskDefinition = new FargateTaskDefinition(this, "CalculationServiceTaskDefinition", {
            memoryLimitMiB: 1024,
            cpu: 512,
            taskRole: calculationServiceTaskRole,
            executionRole: calculationServiceTaskExecutionRole
        });
        const logGroup = new LogGroup(this, "calculationContainerLogGroup", {
            retention: RetentionDays.TWO_YEARS
        });
        addCfnSuppressRules(logGroup, [
            { id: "W84", reason: "LogGroups are by default encrypted server side by CloudWatch Logs Service" }
        ]);
        fargateTaskDefinition.addContainer("CalculationContainer", {
            image: ContainerImage.fromRegistry(props.calculationServiceContainerImage),
            environment: {
                TIME_INTERVAL: "30000", // checks queue every x milliseconds
                BATCH_SIZE: "1000", // pulls up to this amount of messages at once, de-dupes work within batch before calculating
                NEPTUNE_ENDPOINT: props.neptuneEndpoint,
                NEPTUNE_PORT: String(props.neptunePort),
                CALCULATION_SERVICE_QUEUE_URL: calculationServiceQueue.queueUrl,
                CALCULATION_SERVICE_DEADLETTER_QUEUE_URL: calcServiceDLQ.queue.queueUrl,
                REGION: Aws.REGION,
                [API_METRICS_SOLUTION_ID_ENV_KEY]: props.apiMetricsKey
            },
            logging: new AwsLogDriver({
                streamPrefix: "CalculationService",
                mode: AwsLogDriverMode.NON_BLOCKING,
                logGroup: logGroup
            })
        });

        // eslint-disable-next-line @typescript-eslint/no-unused-vars, prettier/prettier
        const calculationService = new FargateService(this, "CalculationService", { // NOSONAR: typescript:S1854
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
