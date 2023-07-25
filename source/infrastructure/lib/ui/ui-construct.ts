// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import { aws_cloudfront as cloudfront, Duration, RemovalPolicy } from "aws-cdk-lib";
import { HeadersFrameOption } from "aws-cdk-lib/aws-cloudfront";
import { Bucket, BucketAccessControl, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { EnvironmentType } from "../supply-chain-simulator-on-aws-solution-stack";

export interface UIConstructProps {
    readonly environment: string;
    readonly solutionUUID: string;
}

export class UIConstruct extends Construct {
    s3Bucket: Bucket;
    buckets: Bucket[];
    distributionDomainName: string;
    constructor(scope: Construct, id: string, props: UIConstructProps) {
        super(scope, id);

        const removalPolicy: RemovalPolicy =
            props.environment === EnvironmentType.PRODUCTION ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;

        const cloudFrontToS3 = new CloudFrontToS3(this, "Web", {
            bucketProps: {
                versioned: true,
                encryption: BucketEncryption.S3_MANAGED,
                accessControl: BucketAccessControl.PRIVATE,
                enforceSSL: true,
                removalPolicy: removalPolicy,
                autoDeleteObjects: false
            },
            cloudFrontDistributionProps: {
                priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
                enableIpv6: false,
                enableLogging: true,
                comment: "UI SupplyChainSimulatorOnAWS CloudFront",
                errorResponses: [
                    {
                        httpStatus: 403,
                        responseHttpStatus: 200,
                        responsePagePath: "/error.html"
                    }
                ]
            },
            responseHeadersPolicyProps: {
                // explicit name passed because it generates a name otherwise
                // that blocks multiple deployments to the same account
                responseHeadersPolicyName: props.solutionUUID,
                securityHeadersBehavior: {
                    contentSecurityPolicy: {
                        contentSecurityPolicy:
                            // adding sha for inline styling that's auto-added by emotion library which is used by material-ui
                            "upgrade-insecure-requests; default-src 'none'; base-uri 'self'; img-src 'self'; script-src 'self'; style-src 'self' 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=' https:; object-src 'none'; font-src 'self' https:; manifest-src 'self'; connect-src 'self' wss://*.amazonaws.com https://*.amazonaws.com https://metrics.awssolutionsbuilder.com",
                        override: true
                    },
                    contentTypeOptions: { override: true },
                    frameOptions: {
                        frameOption: HeadersFrameOption.DENY,
                        override: true
                    },
                    strictTransportSecurity: {
                        accessControlMaxAge: Duration.seconds(47304000),
                        includeSubdomains: true,
                        override: true
                    }
                },
                customHeadersBehavior: {
                    customHeaders: [
                        {
                            header: "Cache-Control",
                            value: "no-store",
                            override: true
                        }
                    ]
                }
            },
            loggingBucketProps: {
                serverAccessLogsPrefix: "ui-s3-log/",
                removalPolicy: removalPolicy
            },
            cloudFrontLoggingBucketProps: {
                serverAccessLogsPrefix: "ui-cf-log/",
                removalPolicy: removalPolicy
            },
            logS3AccessLogs: true,
            insertHttpSecurityHeaders: false
        });

        this.s3Bucket = cloudFrontToS3.s3Bucket as Bucket;
        const s3LoggingBucket = cloudFrontToS3.s3LoggingBucket as Bucket;
        const cloudFrontLoggingBucket = cloudFrontToS3.cloudFrontLoggingBucket as Bucket;
        this.buckets = [];
        if (this.s3Bucket) {
            this.buckets.push(this.s3Bucket);
        }
        if (s3LoggingBucket) {
            this.buckets.push(s3LoggingBucket);
        }
        if (cloudFrontLoggingBucket) {
            this.buckets.push(cloudFrontLoggingBucket);
        }
        this.distributionDomainName = cloudFrontToS3.cloudFrontWebDistribution.distributionDomainName;

        NagSuppressions.addResourceSuppressions(
            cloudFrontToS3,
            [
                { id: "AwsSolutions-CFR1", reason: "The solution does not control geo restriction." },
                { id: "AwsSolutions-CFR2", reason: "No need to enable WAF." },
                {
                    id: "AwsSolutions-CFR4",
                    reason: "No control on the solution side as it is using the CloudFront default certificate."
                }
            ],
            true
        );
    }
}
