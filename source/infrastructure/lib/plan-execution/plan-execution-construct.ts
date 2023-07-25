// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SqsToLambda } from "@aws-solutions-constructs/aws-sqs-lambda";
import { Aws, Duration } from "aws-cdk-lib";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Effect, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { CfnScheduleGroup } from "aws-cdk-lib/aws-scheduler";
import { DeadLetterQueue, Queue, QueueEncryption } from "aws-cdk-lib/aws-sqs";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { ApiMetricsConstructProps, API_METRICS_SOLUTION_ID_ENV_KEY } from "../../../shared/api/apiMetrics";

export interface PlanExecutionConstructProps extends ApiMetricsConstructProps {
    readonly vpc: Vpc;
    readonly ingressSecurityGroup: SecurityGroup;
    readonly sourceCodeBucket: IBucket;
    readonly sourceCodePrefix: string;
    readonly neptuneEndpoint: string;
    readonly neptunePort: number;
    readonly neptuneClusterArn: string;
    readonly stackName: string;
}

export class PlanExecutionConstruct extends Construct {
    planExecutionQueue: Queue;
    lambdaFunctionName: string;
    scheduleGroupName: string;

    constructor(scope: Construct, id: string, props: PlanExecutionConstructProps) {
        super(scope, id);

        const planExecutionDLQ: DeadLetterQueue = {
            maxReceiveCount: 10,
            queue: new Queue(this, "PlanExecutionDLQ", {
                encryption: QueueEncryption.KMS_MANAGED,
                enforceSSL: true
            })
        };

        NagSuppressions.addResourceSuppressions(
            planExecutionDLQ.queue,
            [
                {
                    id: "AwsSolutions-SQS3",
                    reason: "This is a deadletter queue, it itself doesn't need one"
                }
            ],
            true
        );

        this.lambdaFunctionName = `plan-executor-${props.stackName.toLowerCase()}`;
        const lambdaArn = `arn:aws:lambda:${Aws.REGION}:${Aws.ACCOUNT_ID}:function:${this.lambdaFunctionName}`;

        const schedulerRule = new Role(this, "SchedulerRule", {
            assumedBy: new ServicePrincipal("scheduler.amazonaws.com"),
            inlinePolicies: {
                CloudAuth: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            actions: ["lambda:InvokeFunction"],
                            resources: [`${lambdaArn}:*`, `${lambdaArn}`]
                        })
                    ]
                })
            }
        });

        const scheduleGroup = new CfnScheduleGroup(this, "ScheduleGroup", {
            name: Aws.STACK_NAME
        });

        // non null assertion doesn't affect CF template generation
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.scheduleGroupName = scheduleGroup.name!;

        const planExecutionLambda = new SqsToLambda(this, "PlanExecutionLambda", {
            queueProps: {
                encryption: QueueEncryption.KMS_MANAGED,
                enforceSSL: true,
                deadLetterQueue: planExecutionDLQ,
                visibilityTimeout: Duration.minutes(2)
            },
            sqsEventSourceProps: {
                maxBatchingWindow: Duration.seconds(10),
                batchSize: 10
            },
            deployDeadLetterQueue: false,
            lambdaFunctionProps: {
                functionName: this.lambdaFunctionName,
                description: "SupplyChainSimulatorOnAWS plan executor",
                timeout: Duration.minutes(2),
                retryAttempts: 2,
                runtime: Runtime.NODEJS_18_X,
                handler: "index.handler",
                code: Code.fromBucket(props.sourceCodeBucket, `${props.sourceCodePrefix}/plan-execution.zip`),
                memorySize: 1024,
                reservedConcurrentExecutions: 1, // Used to prevent concurrent exceptions on Scheduler CRUD.
                environment: {
                    NEPTUNE_ENDPOINT: props.neptuneEndpoint,
                    NEPTUNE_PORT: String(props.neptunePort),
                    REGION: Aws.REGION,
                    SCHEDULER_RULE_ARN: schedulerRule.roleArn,
                    LAMBDA_FUNCTION_ARN: lambdaArn,
                    [API_METRICS_SOLUTION_ID_ENV_KEY]: props.apiMetricsKey,
                    SCHEDULE_GROUP_NAME: this.scheduleGroupName
                },
                vpc: props.vpc,
                securityGroups: [props.ingressSecurityGroup],
                allowPublicSubnet: true
            }
        });
        this.planExecutionQueue = planExecutionLambda.sqsQueue;

        const planExecutorPolicy = new Policy(this, "PlanExecutorPolicy", {
            statements: [
                new PolicyStatement({
                    sid: "NeptuneDbAccess",
                    actions: [
                        "neptune-db:connect",
                        "neptune-db:ReadDataViaQuery",
                        "neptune-db:WriteDataViaQuery",
                        "neptune-db:DeleteDataViaQuery",
                        "neptune-db:GetQueryStatus",
                        "neptune-db:CancelQuery"
                    ],
                    effect: Effect.ALLOW,
                    resources: [`${props.neptuneClusterArn}/*`]
                }),
                new PolicyStatement({
                    sid: "SchedulerAccess",
                    actions: [
                        "scheduler:GetSchedule",
                        "scheduler:CreateSchedule",
                        "scheduler:UpdateSchedule",
                        "scheduler:DeleteSchedule"
                    ],
                    effect: Effect.ALLOW,
                    resources: [`arn:aws:scheduler:${Aws.REGION}:${Aws.ACCOUNT_ID}:schedule/${this.scheduleGroupName}*`]
                }),
                // required wildcard, list schedules fails otherwise even when passing in groupname as filter
                new PolicyStatement({
                    sid: "SchedulerListAccess",
                    actions: ["scheduler:ListSchedules"],
                    effect: Effect.ALLOW,
                    resources: [`arn:aws:scheduler:${Aws.REGION}:${Aws.ACCOUNT_ID}:schedule/*`]
                }),
                new PolicyStatement({
                    sid: "IamPassRoleAccess",
                    actions: [
                        "iam:PassRole" // to pass IAM LambdaInvoke role to EventBridge Scheduler
                    ],
                    effect: Effect.ALLOW,
                    resources: [schedulerRule.roleArn]
                })
            ]
        });
        planExecutionLambda.lambdaFunction.role?.attachInlinePolicy(planExecutorPolicy);

        NagSuppressions.addResourceSuppressions(
            schedulerRule,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: "Need permissions to trigger Plan Execution Lambda."
                }
            ],
            true
        );

        NagSuppressions.addResourceSuppressions(
            planExecutorPolicy,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: "Need permissions to perform CRUD on Scheduler, Neptune DB, ListSchedules requires wildcard for region"
                }
            ],
            true
        );

        NagSuppressions.addResourceSuppressions(
            <Role>planExecutionLambda.lambdaFunction.role,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: "Need permissions to read from SQS."
                }
            ],
            true
        );
    }
}
