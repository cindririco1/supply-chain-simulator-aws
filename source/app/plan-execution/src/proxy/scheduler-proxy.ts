// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    CreateScheduleCommand,
    CreateScheduleCommandInput,
    DeleteScheduleCommand,
    DeleteScheduleCommandInput,
    GetScheduleCommand,
    GetScheduleCommandInput,
    GetScheduleCommandOutput,
    ListSchedulesCommand,
    ListSchedulesCommandInput,
    ListSchedulesCommandOutput,
    SchedulerClient,
    UpdateScheduleCommand,
    UpdateScheduleCommandInput
} from "@aws-sdk/client-scheduler";
import { ApiMetricsClientFactory } from "shared/api/apiMetrics";
import { Vertex } from "shared/neptune/model/vertex";
import { logger } from "../util/logger";
import { getOneTimeScheduleInputs, getRecurringScheduleInput } from "../util/scheduler-util";

export class SchedulerProxy {
    public client: SchedulerClient;
    constructor() {
        this.client = ApiMetricsClientFactory.Build<SchedulerClient>(SchedulerClient, { region: region });
    }

    /**
     * Fetch an existing EventBridge schedule rule by looking up schedule name which is the item id.
     */
    public async getSchedule(id: string): Promise<GetScheduleCommandOutput> {
        const input: GetScheduleCommandInput = {
            Name: id,
            GroupName: scheduleGroupName
        };

        try {
            return await this.client.send(new GetScheduleCommand(input));
        } catch (e) {
            throw Error(JSON.stringify(e));
        }
    }

    /**
     * Fetch existing EventBridge schedule rules by looking up schedule names which is the item id.
     */
    public async listSchedules(id: string): Promise<ListSchedulesCommandOutput> {
        const input: ListSchedulesCommandInput = {
            NamePrefix: id,
            GroupName: scheduleGroupName
        };

        try {
            return await this.client.send(new ListSchedulesCommand(input));
        } catch (e) {
            throw Error(JSON.stringify(e));
        }
    }

    /**
     * Update recurring EventBridge schedule rule for Inventory plan.
     *
     * Note: If you are updating an existing rule, the rule is replaced with what you specify in this
     * PutRule command. If you omit arguments in PutRule, the old values for those arguments are not kept.
     * Instead, they are replaced with null values. As a result, we need to perform Neptune query to
     * obtain latest vertex properties for updating schedules.
     */
    public async updateRecurringSchedule(vertex: Vertex) {
        const command: UpdateScheduleCommandInput = getRecurringScheduleInput(vertex);

        try {
            await this.client.send(new UpdateScheduleCommand(command));
            logger.info("Updated schedule: " + vertex.id);
        } catch (e) {
            logger.error("Unable to update schedule: " + vertex.id);
            throw Error(JSON.stringify(e));
        }
    }

    /**
     * Update one-time EventBridge schedule rule for transfer plan.
     *
     * There will be 2 rules created since transfer plan will only be called on ship and arrival date.
     *
     * Note: If you are updating an existing rule, the rule is replaced with what you specify in this
     * PutRule command. If you omit arguments in PutRule, the old values for those arguments are not kept.
     * Instead, they are replaced with null values. As a result, we need to perform Neptune query to
     * obtain latest vertex properties for updating schedules.
     */
    public async updateOneTimeSchedule(vertex: Vertex) {
        const commands = getOneTimeScheduleInputs(vertex);
        const shipCommand: UpdateScheduleCommandInput = commands[0];
        const arrivalCommand: UpdateScheduleCommandInput = commands[1];

        try {
            await this.client.send(new UpdateScheduleCommand(shipCommand));
            await this.client.send(new UpdateScheduleCommand(arrivalCommand));
            logger.info(`Updated schedules: ${shipCommand.Name}, ${arrivalCommand.Name}`);
        } catch (e) {
            logger.error(`Unable to update schedules: ${shipCommand.Name}, ${arrivalCommand.Name}`);
            throw Error(JSON.stringify(e));
        }
    }

    /**
     * Create recurring EventBridge schedule rule for Inventory plan.
     */
    public async createRecurringSchedule(vertex: Vertex) {
        const command: CreateScheduleCommandInput = getRecurringScheduleInput(vertex);

        try {
            await this.client.send(new CreateScheduleCommand(command));
            logger.info("Created schedule: " + vertex.id);
        } catch (e) {
            logger.error("Unable to create schedule: " + vertex.id);
            throw Error(JSON.stringify(e));
        }
    }

    /**
     * Create one-time EventBridge schedule rule for transfer plan.
     *
     * There will be 2 rules created since transfer plan will only be called on ship and arrival date.
     */
    public async createOneTimeSchedule(vertex: Vertex) {
        const commands = getOneTimeScheduleInputs(vertex);
        const shipCommand: CreateScheduleCommandInput = commands[0];
        const arrivalCommand: CreateScheduleCommandInput = commands[1];

        try {
            await this.client.send(new CreateScheduleCommand(shipCommand));
            await this.client.send(new CreateScheduleCommand(arrivalCommand));
            logger.info(`Created schedules: ${shipCommand.Name}, ${arrivalCommand.Name}`);
        } catch (e) {
            logger.error(`Unable to create schedules: ${shipCommand.Name}, ${arrivalCommand.Name}`);
            throw Error(JSON.stringify(e));
        }
    }

    /**
     * Delete an existing EventBridge schedule rule by looking up schedule name which is the item id.
     */
    public async deleteSchedule(id: string) {
        const command: DeleteScheduleCommandInput = {
            Name: id,
            GroupName: scheduleGroupName
        };
        try {
            await this.client.send(new DeleteScheduleCommand(command));
            logger.info("Deleted schedule: " + id);
        } catch (e) {
            logger.error("Unable to delete schedule: " + id);
            throw Error(JSON.stringify(e));
        }
    }
}
