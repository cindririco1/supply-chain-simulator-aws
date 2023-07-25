// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { mockClient } from "aws-sdk-client-mock";
import { DeleteScheduleGroupCommand, SchedulerClient } from "@aws-sdk/client-scheduler";
import { handler } from "../index";
import { EventRequest, LambdaContext, RequestTypes, ResourceTypes, StatusTypes } from "../types";
import axios from "axios";
import * as uuid from "uuid";
jest.mock("uuid");
jest.mock("axios");

const mock = mockClient(SchedulerClient);

describe("index", () => {
    beforeEach(() => {
        process.env.API_METRICS_SOLUTION_ID_ENV_KEY = "stub";
        mock.reset();
    });

    test("execute teardown schedule group | success | should call scheduler client sdk teardown group", async () => {
        // arrange
        const testGroupName = "test-group";
        mock.on(DeleteScheduleGroupCommand).resolves({});

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        axios.put.mockImplementation(() =>
            Promise.resolve({
                data: {
                    statusText: "stub status text"
                }
            })
        );

        const eventRequest: EventRequest = {
            RequestType: RequestTypes.DELETE,
            PhysicalResourceId: "stub",
            StackId: "stub",
            ServiceToken: "stub",
            RequestId: "stub",
            LogicalResourceId: "stub",
            ResponseURL: "stub-url",
            ResourceType: ResourceTypes.DELETE_EVENTBRIDGE_SCHEDULES,
            ResourceProperties: {
                Resource: ResourceTypes.DELETE_EVENTBRIDGE_SCHEDULES,
                GroupName: testGroupName,
                Region: "test-region"
            }
        };
        const lambdaContext: LambdaContext = {
            getRemainingTimeInMillis: () => {
                return 10000;
            },
            functionName: "stub-function-name",
            functionVersion: "stub-version",
            invokedFunctionArn: "stub-arn",
            memoryLimitInMB: 100,
            awsRequestId: "stub-request-id",
            logGroupName: "stub-log-group-name",
            logStreamName: "stub-log-stream-name",
            identity: {},
            clientContext: {},
            callbackWaitsForEmptyEventLoop: false
        };

        // act
        const response = await handler(eventRequest, lambdaContext);

        // assert
        const command = mock.commandCalls(DeleteScheduleGroupCommand)[0].firstArg as DeleteScheduleGroupCommand;
        expect(command.input.Name).toBe(testGroupName);
        expect(response.Data).toEqual({});
        expect(response.Status).toBe(StatusTypes.SUCCESS);
    });

    test("execute teardown schedule group | failure | should call scheduler client sdk teardown group", async () => {
        // arrange
        const testGroupName = "test-group";
        mock.on(DeleteScheduleGroupCommand).callsFake(input => {
            throw new Error();
        });

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        axios.put.mockImplementation(() =>
            Promise.resolve({
                data: {
                    statusText: "stub status text"
                }
            })
        );

        const eventRequest: EventRequest = {
            RequestType: RequestTypes.DELETE,
            PhysicalResourceId: "stub",
            StackId: "stub",
            ServiceToken: "stub",
            RequestId: "stub",
            LogicalResourceId: "stub",
            ResponseURL: "stub-url",
            ResourceType: ResourceTypes.DELETE_EVENTBRIDGE_SCHEDULES,
            ResourceProperties: {
                Resource: ResourceTypes.DELETE_EVENTBRIDGE_SCHEDULES,
                GroupName: testGroupName,
                Region: "test-region"
            }
        };
        const lambdaContext: LambdaContext = {
            getRemainingTimeInMillis: () => {
                return 10000;
            },
            functionName: "stub-function-name",
            functionVersion: "stub-version",
            invokedFunctionArn: "stub-arn",
            memoryLimitInMB: 100,
            awsRequestId: "stub-request-id",
            logGroupName: "stub-log-group-name",
            logStreamName: "stub-log-stream-name",
            identity: {},
            clientContext: {},
            callbackWaitsForEmptyEventLoop: false
        };

        // act
        const response = await handler(eventRequest, lambdaContext);

        // assert
        const command = mock.commandCalls(DeleteScheduleGroupCommand)[0].firstArg as DeleteScheduleGroupCommand;
        expect(command.input.Name).toBe(testGroupName);
        expect(response.Data).toEqual({ Error: "Error" });
        expect(response.Status).toBe(StatusTypes.FAILED);
    });

    test("execute uuid | success | should return UUID data while creating", async () => {
        // arrange
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        axios.put.mockImplementation(() =>
            Promise.resolve({
                data: {
                    statusText: "stub status text"
                }
            })
        );

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        uuid.v4.mockImplementation(() => "some-uuid");

        const eventRequest: EventRequest = {
            RequestType: RequestTypes.CREATE,
            PhysicalResourceId: "stub",
            StackId: "stub",
            ServiceToken: "stub",
            RequestId: "stub",
            LogicalResourceId: "stub",
            ResponseURL: "stub-url",
            ResourceType: ResourceTypes.CREATE_UUID,
            ResourceProperties: {
                Resource: ResourceTypes.CREATE_UUID
            }
        };
        const lambdaContext: LambdaContext = {
            getRemainingTimeInMillis: () => {
                return 10000;
            },
            functionName: "stub-function-name",
            functionVersion: "stub-version",
            invokedFunctionArn: "stub-arn",
            memoryLimitInMB: 100,
            awsRequestId: "stub-request-id",
            logGroupName: "stub-log-group-name",
            logStreamName: "stub-log-stream-name",
            identity: {},
            clientContext: {},
            callbackWaitsForEmptyEventLoop: false
        };

        // act
        const response = await handler(eventRequest, lambdaContext);

        // assert
        expect(response.Data).toEqual({ UUID: "some-uuid" });
    });

    test("execute uuid | success | should not return UUID data while not creating", async () => {
        // arrange
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        axios.put.mockImplementation(() =>
            Promise.resolve({
                data: {
                    statusText: "stub status text"
                }
            })
        );

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        uuid.v4.mockImplementation(() => "some-uuid");

        const eventRequest: EventRequest = {
            RequestType: RequestTypes.DELETE,
            PhysicalResourceId: "stub",
            StackId: "stub",
            ServiceToken: "stub",
            RequestId: "stub",
            LogicalResourceId: "stub",
            ResponseURL: "stub-url",
            ResourceType: ResourceTypes.CREATE_UUID,
            ResourceProperties: {
                Resource: ResourceTypes.CREATE_UUID
            }
        };
        const lambdaContext: LambdaContext = {
            getRemainingTimeInMillis: () => {
                return 10000;
            },
            functionName: "stub-function-name",
            functionVersion: "stub-version",
            invokedFunctionArn: "stub-arn",
            memoryLimitInMB: 100,
            awsRequestId: "stub-request-id",
            logGroupName: "stub-log-group-name",
            logStreamName: "stub-log-stream-name",
            identity: {},
            clientContext: {},
            callbackWaitsForEmptyEventLoop: false
        };

        // act
        const response = await handler(eventRequest, lambdaContext);

        // assert
        expect(response.Data).toEqual({});
    });

    test("operational metrics | success | should send to operational metrics server", async () => {
        // arrange
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        axios.put.mockImplementation(() =>
            Promise.resolve({
                data: {
                    statusText: "stub status text"
                }
            })
        );

        // arrange
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        axios.post.mockImplementation(() => Promise.resolve());

        const axiosPostSpy = jest.spyOn(axios, "post");

        const mockDate = new Date(1466424490000);
        const dateSpy = jest.spyOn(global, "Date").mockImplementation(() => mockDate);

        const eventRequest: EventRequest = {
            RequestType: RequestTypes.CREATE,
            PhysicalResourceId: "stub",
            StackId: "stub",
            ServiceToken: "stub",
            RequestId: "stub",
            LogicalResourceId: "stub",
            ResponseURL: "stub-url",
            ResourceType: ResourceTypes.SEND_OPERATIONAL_METRICS,
            ResourceProperties: {
                Resource: ResourceTypes.SEND_OPERATIONAL_METRICS,
                ShouldSend: true,
                SolutionId: "solution-id",
                SolutionVersion: "solution-version",
                SolutionUUID: "solution-uuid",
                Region: "test-region"
            }
        };
        const lambdaContext: LambdaContext = {
            getRemainingTimeInMillis: () => {
                return 10000;
            },
            functionName: "stub-function-name",
            functionVersion: "stub-version",
            invokedFunctionArn: "stub-arn",
            memoryLimitInMB: 100,
            awsRequestId: "stub-request-id",
            logGroupName: "stub-log-group-name",
            logStreamName: "stub-log-stream-name",
            identity: {},
            clientContext: {},
            callbackWaitsForEmptyEventLoop: false
        };

        // act
        const response = await handler(eventRequest, lambdaContext);

        // assert
        expect(response.Data).toEqual({});
        expect(response.Status).toEqual(StatusTypes.SUCCESS);
        expect(axiosPostSpy).toHaveBeenCalledTimes(1);
        expect(axiosPostSpy).toHaveBeenCalledWith(
            "https://metrics.awssolutionsbuilder.com/generic",
            '{"Solution":"solution-id","Version":"solution-version","UUID":"solution-uuid","TimeStamp":"2016-06-20 12:08:10.000","Data":{"EventType":"DeployStack","Region":"test-region"}}',
            { headers: { "Content-Type": "application/json" } }
        );
        axiosPostSpy.mockRestore();
        dateSpy.mockRestore();
    });

    test("operational metrics | success | should not send to operational metrics server when no send passed", async () => {
        // arrange
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        axios.put.mockImplementation(() =>
            Promise.resolve({
                data: {
                    statusText: "stub status text"
                }
            })
        );

        // arrange
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        axios.post.mockImplementation(() => Promise.resolve());

        const axiosPostSpy = jest.spyOn(axios, "post");

        const mockDate = new Date(1466424490000);
        const dateSpy = jest.spyOn(global, "Date").mockImplementation(() => mockDate);

        const eventRequest: EventRequest = {
            RequestType: RequestTypes.CREATE,
            PhysicalResourceId: "stub",
            StackId: "stub",
            ServiceToken: "stub",
            RequestId: "stub",
            LogicalResourceId: "stub",
            ResponseURL: "stub-url",
            ResourceType: ResourceTypes.SEND_OPERATIONAL_METRICS,
            ResourceProperties: {
                Resource: ResourceTypes.SEND_OPERATIONAL_METRICS,
                ShouldSend: false,
                SolutionId: "solution-id",
                SolutionVersion: "solution-version",
                SolutionUUID: "solution-uuid",
                Region: "test-region"
            }
        };
        const lambdaContext: LambdaContext = {
            getRemainingTimeInMillis: () => {
                return 10000;
            },
            functionName: "stub-function-name",
            functionVersion: "stub-version",
            invokedFunctionArn: "stub-arn",
            memoryLimitInMB: 100,
            awsRequestId: "stub-request-id",
            logGroupName: "stub-log-group-name",
            logStreamName: "stub-log-stream-name",
            identity: {},
            clientContext: {},
            callbackWaitsForEmptyEventLoop: false
        };

        // act
        const response = await handler(eventRequest, lambdaContext);

        // assert
        expect(response.Data).toEqual({});
        expect(response.Status).toEqual(StatusTypes.SUCCESS);
        expect(axiosPostSpy).toHaveBeenCalledTimes(0);
        axiosPostSpy.mockRestore();
        dateSpy.mockRestore();
    });
});
