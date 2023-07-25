// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { addCfnSuppressRules } from "@aws-solutions-constructs/core";
import { Aws, CustomResource, Duration } from "aws-cdk-lib";
import { IVpc, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";

export interface UICustomResourceConstructProps {
    readonly apiEndpoint: string;
    readonly awsRegion: string;
    readonly userPoolId: string;
    readonly userPoolClientId: string;
    readonly sourceCodeBucket: IBucket;
    readonly sourceCodePrefix: string;
    readonly destinationCodeBucket: IBucket;
    readonly vpc: IVpc;
    readonly uiBuckets: IBucket[];
}

export class UICustomResourceConstruct extends Construct {
    constructor(scope: Construct, id: string, props: UICustomResourceConstructProps) {
        super(scope, id);

        const fnSecurityGroup = new SecurityGroup(this, "uiCopyAssetsToS3FnSecGroup", {
            vpc: props.vpc,
            description: "Controls access for the uiCopyAssetsToS3Fn"
        });

        addCfnSuppressRules(fnSecurityGroup, [
            {
                id: "W5",
                reason: "Egress security groups with cidr open to world are generally considered OK"
            },
            {
                id: "W40",
                reason: "Egress security groups with IpProtocol of -1 are generally considered OK"
            }
        ]);

        // Setup the IAM Role for Lambda Service
        const lambdaServiceRole = new Role(this, "uiCopyAssetsToS3FnServiceRole", {
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
                        // If this Lambda function is going to access resoures in a
                        // VPC, then it needs privileges to access an ENI in that VPC
                        // See link for example of this done in solution constructs:
                        // https://github.com/awslabs/aws-solutions-constructs/blob/4a499dea17ed76e826ac00f6b443e4464f776512/source/patterns/%40aws-solutions-constructs/core/lib/lambda-helper.ts#L105-L116
                        new PolicyStatement({
                            actions: [
                                "ec2:CreateNetworkInterface",
                                "ec2:DescribeNetworkInterfaces",
                                "ec2:DeleteNetworkInterface",
                                "ec2:AssignPrivateIpAddresses",
                                "ec2:UnassignPrivateIpAddresses"
                            ],
                            resources: ["*"]
                        }),
                        new PolicyStatement({
                            actions: ["s3:GetObject"],
                            resources: [`${props.sourceCodeBucket.bucketArn}`, `${props.sourceCodeBucket.bucketArn}/*`]
                        }),
                        new PolicyStatement({
                            actions: ["s3:PutObject"],
                            resources: [
                                `${props.destinationCodeBucket.bucketArn}`,
                                `${props.destinationCodeBucket.bucketArn}/*`
                            ]
                        }),
                        new PolicyStatement({
                            actions: ["s3:PutBucketLogging", "s3:ListBucketVersions"],
                            effect: Effect.ALLOW,
                            resources: props.uiBuckets.flatMap(bucket => [bucket.bucketArn, `${bucket.bucketArn}/*`])
                        })
                    ]
                })
            }
        });

        const uiCopyAssetsFn = new Function(this, `uiCopyAssetsToS3Fn`, {
            runtime: Runtime.PYTHON_3_10,
            code: Code.fromBucket(props.sourceCodeBucket, `${props.sourceCodePrefix}/custom-resource-handlers.zip`),
            handler: "ui_copy_assets.lambda_handler",
            memorySize: 256,
            timeout: Duration.minutes(15),
            environment: {
                ApiEndpoint: props.apiEndpoint,
                AwsRegion: props.awsRegion,
                UserPoolId: props.userPoolId,
                DataBucketName: props.destinationCodeBucket.bucketName,
                PoolClientId: props.userPoolClientId
            },
            reservedConcurrentExecutions: 1,
            vpc: props.vpc,
            securityGroups: [fnSecurityGroup],
            role: lambdaServiceRole
        });
        props.sourceCodeBucket.grantReadWrite(uiCopyAssetsFn);
        props.uiBuckets.forEach(bucket => bucket.grantReadWrite(uiCopyAssetsFn));
        NagSuppressions.addResourceSuppressions(
            uiCopyAssetsFn,
            [
                {
                    id: "AwsSolutions-IAM4",
                    reason: "Default Lambda AWS managed policies, all permissions are required."
                },
                {
                    id: "AwsSolutions-IAM5",
                    reason: "UI copy assets Lambda requires ability to read / write to both website bucket and build bucket"
                }
            ],
            true
        );
        NagSuppressions.addResourceSuppressions(
            lambdaServiceRole,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: `Lambda functions has the required permission to write CloudWatch Logs. It uses custom policy instead of arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole with tighter permissions.`
                }
            ],
            true
        );
        addCfnSuppressRules(lambdaServiceRole, [
            {
                id: "W11",
                reason: "This Lambda function is going to access resoures in a VPC; it needs privileges to access an ENI in that VPC."
            }
        ]);

        // eslint-disable-next-line prettier/prettier
        new CustomResource(this, "customResource00001", { // NOSONAR: typescript:S1848
            serviceToken: uiCopyAssetsFn.functionArn,
            properties: {
                WebsiteCodeBucket: props.sourceCodeBucket.bucketName,
                WebsiteCodePrefix: props.sourceCodePrefix + "/website",
                DeploymentBucket: props.destinationCodeBucket.bucketName,
                UiBuckets: props.uiBuckets.map(bucket => bucket.bucketName)
            }
        });
    }
}
