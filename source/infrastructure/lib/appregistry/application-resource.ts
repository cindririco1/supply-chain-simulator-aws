// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Application, AttributeGroup } from "@aws-cdk/aws-servicecatalogappregistry-alpha";
import { Aws, CfnMapping, Fn, Stack, Tags } from "aws-cdk-lib";
import "../common/cfnMapping-extension";
import { SolutionProps } from "../supply-chain-simulator-on-aws-solution-stack";

//  Set an arbitrary value to use as a prefix for the DefaultApplicationAttributeGroup name
//  This may change in the future, and must not match the previous two prefixes
const attributeGroupPrefix = "S01";

//  Declare KVP object for type checked values
const AppRegistryMetadata = {
    ID: "ID",
    Version: "Version",
    AppRegistryApplicationName: "AppRegistryApplicationName",
    SolutionName: "SolutionName",
    ApplicationType: "ApplicationType"
};

export function applyAppRegistry(stack: Stack, solutionProps: SolutionProps) {
    //  Declare CFN Mappings
    const map = new CfnMapping(stack, "Solution", { lazy: true });
    map.setDataMapValue(AppRegistryMetadata.ID, solutionProps.solutionId);
    map.setDataMapValue(AppRegistryMetadata.Version, solutionProps.solutionVersion);
    map.setDataMapValue(AppRegistryMetadata.AppRegistryApplicationName, solutionProps.solutionName);
    map.setDataMapValue(AppRegistryMetadata.SolutionName, solutionProps.solutionName);
    map.setDataMapValue(AppRegistryMetadata.ApplicationType, "AWS-Solutions");

    const application = new Application(stack, "Application", {
        applicationName: Fn.join("-", [
            map.findInDataMap(AppRegistryMetadata.AppRegistryApplicationName),
            Aws.REGION,
            Aws.ACCOUNT_ID,
            Aws.STACK_NAME
        ]),
        description: solutionProps.description ?? "Supply Chain Simulator On AWS Description"
    });
    application.associateApplicationWithStack(stack);

    Tags.of(application).add("Solutions:SolutionID", map.findInDataMap(AppRegistryMetadata.ID));
    Tags.of(application).add("Solutions:SolutionName", map.findInDataMap(AppRegistryMetadata.SolutionName));
    Tags.of(application).add("Solutions:SolutionVersion", map.findInDataMap(AppRegistryMetadata.Version));
    Tags.of(application).add("Solutions:ApplicationType", map.findInDataMap(AppRegistryMetadata.ApplicationType));

    const attributeGroup = new AttributeGroup(stack, "DefaultApplicationAttributeGroup", {
        //  Use SolutionName as a unique prefix for the attribute group name
        attributeGroupName: Fn.join("-", [attributeGroupPrefix, Aws.REGION, Aws.STACK_NAME]),
        description: "Attribute group for solution information",
        attributes: {
            applicationType: map.findInDataMap(AppRegistryMetadata.ApplicationType),
            version: map.findInDataMap(AppRegistryMetadata.Version),
            solutionID: map.findInDataMap(AppRegistryMetadata.ID),
            solutionName: map.findInDataMap(AppRegistryMetadata.SolutionName)
        }
    });
    attributeGroup.associateWith(application);
}
