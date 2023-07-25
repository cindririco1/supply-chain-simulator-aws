// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { fromIni, fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { Config } from "../util/config";
import {
    GetScheduleCommand,
    GetScheduleCommandOutput,
    ListSchedulesCommand,
    ListSchedulesCommandOutput,
    SchedulerClient
} from "@aws-sdk/client-scheduler";
import { SchedulerDetails } from "../util/constants";

export class SchedulerProxy {
    private readonly client: SchedulerClient;

    constructor(config: Config) {
        const credentials =
            config.profile != undefined ? fromIni({ profile: config.profile }) : fromNodeProviderChain();
        this.client = new SchedulerClient({
            credentials: credentials,
            region: config.region
        });
    }

    /**
     * Fetch the scheduler details by looking up scheduled hour and customized target input.
     */
    public async getRecurringSchedulerDetails(
        schedulerName: string,
        scheduleGroupName: string
    ): Promise<SchedulerDetails> {
        const command: GetScheduleCommand = new GetScheduleCommand({
            Name: schedulerName,
            GroupName: scheduleGroupName
        });
        const response: GetScheduleCommandOutput = await this.client.send(command);

        const scheduleExpression = response.ScheduleExpression;
        if (scheduleExpression === undefined) {
            throw Error(`Unable to find schedule expression on schedule: ${schedulerName}`);
        }
        const scheduleHour = scheduleExpression.substring(7, scheduleExpression.indexOf("*") - 1);

        const target = response.Target;
        if (target === undefined) {
            throw Error(`Unable to find target on schedule: ${schedulerName}`);
        }
        const input = target.Input;

        return {
            scheduleTime: scheduleHour!,
            input: input!
        };
    }

    /**
     * Fetch the scheduler details by looking up scheduled hour and customized target input.
     */
    public async getOneTimeSchedulerDetails(
        schedulerName: string,
        scheduleGroupName: string
    ): Promise<SchedulerDetails> {
        const command: GetScheduleCommand = new GetScheduleCommand({
            Name: schedulerName,
            GroupName: scheduleGroupName
        });
        const response: GetScheduleCommandOutput = await this.client.send(command);

        const scheduleExpression = response.ScheduleExpression;
        if (scheduleExpression === undefined) {
            throw Error(`Unable to find schedule expression on schedule: ${schedulerName}`);
        }
        const scheduleTimestamp = scheduleExpression.substring(3, scheduleExpression.length - 1);

        const target = response.Target;
        if (target === undefined) {
            throw Error(`Unable to find target on schedule: ${schedulerName}`);
        }
        const input = target.Input;

        return {
            scheduleTime: scheduleTimestamp!,
            input: input!
        };
    }

    /**
     * Check if the specified scheduler exists by looking up scheduler name.
     */
    public async isSchedulerExist(schedulerName: string, scheduleGroupName: string): Promise<boolean> {
        const command: ListSchedulesCommand = new ListSchedulesCommand({
            NamePrefix: schedulerName,
            GroupName: scheduleGroupName
        });
        const response: ListSchedulesCommandOutput = await this.client.send(command);
        const schedules = response.Schedules;

        return !(schedules === undefined || schedules.length === 0);
    }
}
