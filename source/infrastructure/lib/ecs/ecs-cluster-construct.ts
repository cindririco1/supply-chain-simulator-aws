// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Construct } from "constructs";
import { Cluster } from "aws-cdk-lib/aws-ecs";
import { Vpc } from "aws-cdk-lib/aws-ec2";

export interface ECSClusterConstructProps {
    readonly vpc: Vpc;
}

export class ECSClusterConstruct extends Construct {
    cluster: Cluster;

    constructor(scope: Construct, id: string, props: ECSClusterConstructProps) {
        super(scope, id);

        const cluster = new Cluster(this, "Cluster", {
            vpc: props.vpc,
            containerInsights: true
        });
        this.cluster = cluster;
    }
}
