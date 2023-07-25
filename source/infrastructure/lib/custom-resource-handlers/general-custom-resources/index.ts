// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    DeleteScheduleGroupCommand,
    DeleteScheduleGroupCommandInput,
    SchedulerClient
} from "@aws-sdk/client-scheduler";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import {
    CustomResourceResponse,
    DeleteEventBridgeSchedulesProperties,
    DeleteEventBridgeSchedulesRequest,
    EventRequest,
    LambdaContext,
    METRICS_ENDPOINT,
    RequestTypes,
    ResourceTypes,
    SendOperationalMetricsProperties,
    SendOperationalMetricsRequest,
    StackEventMetricData,
    StackEventTypes,
    StatusTypes,
    UuidResponse
} from "./types";
import { v4 } from "uuid";

/**
 * Creates a solution UUID.
 * @param requestType The custom resource request type
 * @returns When it's creation, returns UUID. Otherwise, return an empty object.
 */
export function createUuid(requestType: RequestTypes): UuidResponse {
    if (requestType === RequestTypes.CREATE) {
        return { UUID: v4() };
    }

    return {};
}

/**
 * Deletes eventbridge schedules
 * @param params The custom resource request type and the schedule group name used to delete schedules
 */
export async function deleteEventbridgeSchedules(params: DeleteEventBridgeSchedulesRequest): Promise<void> {
    if (params.requestType === RequestTypes.DELETE) {
        // not using api metrics key for now since including shared lib breaks deployment unzipped size on deploy for lambda
        const client = new SchedulerClient({
            region: params.resourceProperties.Region
        });

        const commandInput: DeleteScheduleGroupCommandInput = {
            Name: params.resourceProperties.GroupName
        };

        await client.send(new DeleteScheduleGroupCommand(commandInput));
    }
}

/**
 * Sends anonymous usage metrics.
 * @param data Data to send a anonymous metric
 * @param solutionId The solution's id
 * @param solutionUUID The solution UUID
 * @param solutionVersion The solution's version
 */
export async function sendAnonymousMetrics(
    data: StackEventMetricData,
    solutionId: string,
    solutionUUID: string,
    solutionVersion: string
) {
    try {
        const body = {
            Solution: solutionId,
            Version: solutionVersion,
            UUID: solutionUUID,
            TimeStamp: new Date().toISOString().replace("T", " ").replace("Z", ""),
            Data: data
        };

        const config = {
            headers: { "Content-Type": "application/json" }
        };

        await axios.post(METRICS_ENDPOINT, JSON.stringify(body), config);
    } catch (error) {
        console.error("Error sending an anonymous metric: ", error);
    }
}

/**
 * Send Operational Metrics
 * @param params The custom resource request type for metrics to send
 */
export async function sendOperationalMetrics(params: SendOperationalMetricsRequest): Promise<void> {
    const { requestType, resourceProperties } = params;
    const { ShouldSend, SolutionUUID, SolutionId, SolutionVersion, Region } = resourceProperties;

    if (ShouldSend || String(ShouldSend) === "true" || String(ShouldSend) === "True") {
        const anonymousMetrics: StackEventMetricData = {
            EventType: StackEventTypes.DEPLOY,
            Region: Region
        };

        switch (requestType) {
            case RequestTypes.CREATE:
                anonymousMetrics.EventType = StackEventTypes.DEPLOY;
                break;
            case RequestTypes.UPDATE:
                anonymousMetrics.EventType = StackEventTypes.UPDATE;
                break;
            case RequestTypes.DELETE:
                anonymousMetrics.EventType = StackEventTypes.DELETE;
                break;
            default:
                throw new Error(`Not supported request type: ${requestType}`);
        }

        await sendAnonymousMetrics(anonymousMetrics, SolutionId, SolutionUUID, SolutionVersion);
    } else {
        console.log("Skipping sending anonymous operational metrics");
    }
}

/**
 * Handles the custom resource requests.
 * @param event The custom resource event
 * @param context The Lambda function context
 * @returns The custom resource response
 */
export async function handler(event: EventRequest, context: LambdaContext): Promise<CustomResourceResponse> {
    const { RequestType, ResourceProperties } = event;
    const { Resource } = ResourceProperties;
    const response: CustomResourceResponse = {
        Status: StatusTypes.SUCCESS,
        Data: {}
    };
    let reason = `See the details in CloudWatch Log Stream: ${context.logStreamName}`;
    try {
        switch (Resource) {
            case ResourceTypes.DELETE_EVENTBRIDGE_SCHEDULES:
                await deleteEventbridgeSchedules({
                    requestType: RequestType,
                    resourceProperties: <DeleteEventBridgeSchedulesProperties>ResourceProperties
                });
                break;
            case ResourceTypes.SEND_OPERATIONAL_METRICS:
                await sendOperationalMetrics({
                    requestType: RequestType,
                    resourceProperties: <SendOperationalMetricsProperties>ResourceProperties
                });
                break;
            case ResourceTypes.CREATE_UUID:
                response.Data = createUuid(RequestType);
                break;
            default:
                throw new Error(`Not supported custom resource type: ${Resource}`);
        }
    } catch (error) {
        response.Status = StatusTypes.FAILED;
        response.Data = { Error: String(error) };
        reason = String(error);
    }

    const cloudFormationResponse = await sendCloudFormationResponse(event, response, reason);
    console.log(
        `Status text: ${cloudFormationResponse.statusText}, code: ${
            cloudFormationResponse.status
        }, response: ${JSON.stringify(response)}`
    );

    return response;
}

/**
 * Sends a response to the CloudFormation response URL.
 * @param event The custom resource event
 * @param response The custom resource response
 * @param reason The error reason
 * @returns The response from the CloudFront response URL
 */
async function sendCloudFormationResponse(
    event: EventRequest,
    response: CustomResourceResponse,
    reason: string
): Promise<AxiosResponse> {
    const responseBody = JSON.stringify({
        Status: response.Status,
        Reason: reason,
        PhysicalResourceId: event.LogicalResourceId,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: response.Data
    });
    console.log(`Response body: ${JSON.stringify(responseBody, null, 2)}`);

    const config: AxiosRequestConfig = {
        headers: {
            "Content-Length": `${responseBody.length}`,
            "Content-Type": ""
        }
    };

    return axios.put(event.ResponseURL, responseBody, config);
}
