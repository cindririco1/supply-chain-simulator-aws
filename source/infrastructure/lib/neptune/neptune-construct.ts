// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ClusterParameterGroup, DatabaseCluster, InstanceType, ParameterGroupFamily } from "@aws-cdk/aws-neptune-alpha"; // no types available for neptune in cdk v2
import { Aws, Duration, RemovalPolicy } from "aws-cdk-lib";
import { PredefinedMetric, ScalableTarget, ServiceNamespace } from "aws-cdk-lib/aws-applicationautoscaling";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { EnvironmentType } from "../supply-chain-simulator-on-aws-solution-stack";

export interface NeptuneConstructProps {
    readonly vpc: Vpc;
    readonly databasePort: number;
    readonly databaseSecurityGroup: SecurityGroup;
    readonly environment: string;
    readonly minAutoscalingInstances: number;
    readonly maxAutoscalingInstances: number;
    readonly databaseInstanceSize: string;
    readonly databaseBackupRetentionDays: number;
}

export class NeptuneConstruct extends Construct {
    neptuneEndpoint: string;
    neptunePort: string;
    neptuneClusterArn: string;

    constructor(scope: Construct, id: string, props: NeptuneConstructProps) {
        super(scope, id);

        const removalPolicy: RemovalPolicy =
            props.environment === EnvironmentType.PRODUCTION ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
        const clusterParams = new ClusterParameterGroup(this, "ClusterParams", {
            description: "SupplyChainSimulatorOnAWS cluster parameter group",
            family: ParameterGroupFamily.NEPTUNE_1_2,
            parameters: {
                neptune_streams: "1",
                neptune_enable_audit_log: "1"
            }
        });

        // hardcoded to r5 large for M1 release
        // https://docs.aws.amazon.com/neptune/latest/userguide/instance-types.html
        // according to above, works "well for most graph use cases"
        // future plans are to leverage neptune serverless
        let instanceType = InstanceType.R5_LARGE;
        if (props.databaseInstanceSize === "db.t3.medium") {
            instanceType = InstanceType.T3_MEDIUM;
        }

        const cluster = new DatabaseCluster(this, "Cluster", {
            vpc: props.vpc,
            instanceType: instanceType,
            port: props.databasePort,
            deletionProtection: false,
            autoMinorVersionUpgrade: true,
            backupRetention: Duration.days(props.databaseBackupRetentionDays),
            iamAuthentication: true,
            securityGroups: [props.databaseSecurityGroup],
            clusterParameterGroup: clusterParams,
            instances: 2,
            removalPolicy: removalPolicy
        });

        new ScalableTarget(this, "ScalableTarget", {
            serviceNamespace: ServiceNamespace.NEPTUNE,
            scalableDimension: "neptune:cluster:ReadReplicaCount",
            resourceId: `cluster:${cluster.clusterIdentifier}`,
            minCapacity: props.minAutoscalingInstances,
            maxCapacity: props.maxAutoscalingInstances
        }).scaleToTrackMetric("NeptuneUtilizationTarget", {
            predefinedMetric: PredefinedMetric.NEPTURE_READER_AVERAGE_CPU_UTILIZATION,
            targetValue: 75,
            disableScaleIn: false
        });

        this.neptuneEndpoint = cluster.clusterEndpoint.hostname;
        this.neptunePort = String(cluster.clusterEndpoint.port);
        this.neptuneClusterArn = `arn:aws:neptune-db:${Aws.REGION}:${Aws.ACCOUNT_ID}:${cluster.clusterResourceIdentifier}`;
    }
}
