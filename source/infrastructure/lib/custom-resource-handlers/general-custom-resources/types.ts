// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export const METRICS_ENDPOINT = "https://metrics.awssolutionsbuilder.com/generic";

export enum ResourceTypes {
    DELETE_EVENTBRIDGE_SCHEDULES = "DELETE_EVENTBRIDGE_SCHEDULES",
    SEND_OPERATIONAL_METRICS = "SEND_OPERATIONAL_METRICS",
    CREATE_UUID = "CREATE_UUID"
}

export interface CustomResourceResponse {
    Status: StatusTypes;
    Data: CustomResourceResponseData;
}

export interface CustomResourceErrorData {
    Error: string;
}

type ResourcePropertyTypes = ResourceProperty | DeleteEventBridgeSchedulesProperties | SendOperationalMetricsProperties;
type CustomResourceResponseData = Partial<CustomResourceErrorData> | Partial<UuidResponse>;
export interface EventRequest {
    RequestType: RequestTypes;
    PhysicalResourceId: string;
    StackId: string;
    ServiceToken: string;
    RequestId: string;
    LogicalResourceId: string;
    ResponseURL: string;
    ResourceType: string;
    ResourceProperties: ResourcePropertyTypes;
}

export interface LambdaContext {
    getRemainingTimeInMillis: () => number;
    functionName: string;
    functionVersion: string;
    invokedFunctionArn: string;
    memoryLimitInMB: number;
    awsRequestId: string;
    logGroupName: string;
    logStreamName: string;
    identity: object;
    clientContext: object;
    callbackWaitsForEmptyEventLoop: boolean;
}

export enum StatusTypes {
    SUCCESS = "SUCCESS",
    FAILED = "FAILED"
}

export enum StackEventTypes {
    DEPLOY = "DeployStack",
    UPDATE = "UpdateStack",
    DELETE = "DeleteStack"
}

interface ResourceProperty {
    Resource: ResourceTypes;
}

export enum RequestTypes {
    CREATE = "Create",
    DELETE = "Delete",
    UPDATE = "Update"
}

export interface DeleteEventBridgeSchedulesProperties extends ResourceProperty {
    GroupName: string;
    Region: string;
}

export interface SendOperationalMetricsProperties extends ResourceProperty {
    ShouldSend: boolean;
    SolutionId: string;
    SolutionVersion: string;
    SolutionUUID: string;
    Region: string;
}

export interface StackEventMetricData {
    EventType: StackEventTypes;
    Region: string;
}

export interface DeleteEventBridgeSchedulesRequest {
    requestType: RequestTypes;
    resourceProperties: DeleteEventBridgeSchedulesProperties;
}

export interface SendOperationalMetricsRequest {
    requestType: RequestTypes;
    resourceProperties: SendOperationalMetricsProperties;
}

export interface UuidResponse {
    UUID?: string;
}
