// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { addCfnSuppressRules } from "@aws-solutions-constructs/core";
import {
    FlowLogDestination,
    FlowLogTrafficType,
    GatewayVpcEndpointAwsService,
    InterfaceVpcEndpoint,
    InterfaceVpcEndpointAwsService,
    Peer,
    Port,
    SecurityGroup,
    SubnetType,
    Vpc
} from "aws-cdk-lib/aws-ec2";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

export interface VpcConstructProps {
    readonly databasePort: number;
}

export class VpcConstruct extends Construct {
    public vpcId: string;
    public databaseSecurityGroup: SecurityGroup;
    public ingressSecurityGroup: SecurityGroup;
    public vpc: Vpc;
    public privateSubnetIds: string[];

    constructor(scope: Construct, id: string, props: VpcConstructProps) {
        super(scope, id);

        const vpcCidr = this.node.tryGetContext("VpcCIDR"); // 10.1.0.0/16
        const vpcFlowLogLogGroup = new LogGroup(this, "VPCFlowLogs", {
            retention: RetentionDays.TWO_YEARS
        });
        addCfnSuppressRules(vpcFlowLogLogGroup, [
            { id: "W84", reason: "LogGroups are by default encrypted server side by CloudWatch Logs Service" }
        ]);
        const vpc = new Vpc(this, "VPC", {
            cidr: vpcCidr,
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: "db",
                    subnetType: SubnetType.PRIVATE_WITH_EGRESS
                },
                {
                    cidrMask: 24,
                    name: "ingress",
                    subnetType: SubnetType.PUBLIC,
                    mapPublicIpOnLaunch: false
                }
            ],
            gatewayEndpoints: {
                S3: {
                    service: GatewayVpcEndpointAwsService.S3
                }
            },
            flowLogs: {
                flowLogs: {
                    destination: FlowLogDestination.toCloudWatchLogs(vpcFlowLogLogGroup),
                    trafficType: FlowLogTrafficType.REJECT
                }
            }
        });
        this.vpcId = vpc.vpcId;
        this.vpc = vpc;

        const ingressSecurityGroup = new SecurityGroup(this, "IngressSecurityGroup", {
            vpc,
            description: "Used for accessing the database",
            allowAllOutbound: true
        });

        const databaseSecurityGroup = new SecurityGroup(this, "DatabaseSecurityGroup", {
            vpc,
            description: "Used by the database",
            allowAllOutbound: true
        });
        databaseSecurityGroup.addIngressRule(
            Peer.securityGroupId(ingressSecurityGroup.securityGroupId),
            Port.tcp(props.databasePort)
        );

        // eslint-disable-next-line prettier/prettier
        const kmsVpcEndpoint = new InterfaceVpcEndpoint(this, "KmsVpcEndpoint", { // NOSONAR: typescript:S1854
            vpc: vpc,
            service: InterfaceVpcEndpointAwsService.KMS
        });

        addCfnSuppressRules(databaseSecurityGroup, [
            {
                id: "W5",
                reason: "Egress security groups with cidr open to world are generally considered OK"
            },
            {
                id: "W40",
                reason: "Egress security groups with IpProtocol of -1 are generally considered OK"
            }
        ]);
        addCfnSuppressRules(ingressSecurityGroup, [
            {
                id: "W5",
                reason: "Egress security groups with cidr open to world are generally considered OK"
            },
            {
                id: "W40",
                reason: "Egress security groups with IpProtocol of -1 are generally considered OK"
            }
        ]);

        this.databaseSecurityGroup = databaseSecurityGroup;
        this.ingressSecurityGroup = ingressSecurityGroup;
        this.privateSubnetIds = vpc.privateSubnets.map(subnet => subnet.subnetId);
    }
}
