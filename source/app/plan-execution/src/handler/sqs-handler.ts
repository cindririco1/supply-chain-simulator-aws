// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { SQSRecord } from "../model/sqs-types";
import { logger } from "../util/logger";
import { SchedulerProxy } from "../proxy/scheduler-proxy";
import { ChangeLogEvent } from "../model";
import { NeptuneProxy } from "../proxy/neptune-proxy";
import { TransferPlanStatus } from "shared/neptune/model/constants";

export class SQSHandler {
    public schedulerProxy;
    public neptuneProxy;

    constructor(schedulerProxy: SchedulerProxy, neptuneProxy: NeptuneProxy) {
        this.schedulerProxy = schedulerProxy;
        this.neptuneProxy = neptuneProxy;
    }

    public async handleSQSEvent(records: SQSRecord[]) {
        for (const record of records) {
            if (record.body) {
                let body;
                try {
                    body = JSON.parse(record.body);
                } catch (e) {
                    logger.error(`Parsing errors: `, JSON.stringify(e));
                    throw Error("SQS event parsing error");
                }
                await this.handleSQSRecordBody(body);
            }
        }
    }

    private async handleSQSRecordBody(body: any) {
        const schedulerExist = await this.checkIfPlanExist(body.id);
        const planExist = await this.neptuneProxy.hasPlan(body.id, body.label);
        if (!schedulerExist && body.op === "ADD" && planExist) {
            // create a new vertex if scheduler doesn't exist
            await this.createPlan(body);
        } else {
            if (body.op === "ADD" && planExist) {
                // handle update for vertex's properties
                await this.updatePlan(body);
            } else if (body.op === "REMOVE" && schedulerExist && !planExist) {
                // delete a vertex if scheduler already exists
                await this.deletePlan(body);
            } else {
                logger.debug(`Vertex ${body.id} has already been deleted, body: ${JSON.stringify(body)}`);
            }
        }
    }

    /**
     * Create a new inventory plan or transfer plan based on the query result returns from the neptune db.
     * Also, the transfer plan status will be updated from new to scheduled.
     */
    private async createPlan(body: ChangeLogEvent) {
        if (body.label === "inventory-plan") {
            const plan = await this.neptuneProxy.getInventoryPlan(body.id);
            await this.schedulerProxy.createRecurringSchedule(plan);
        } else {
            const plan = await this.neptuneProxy.getTransferPlan(body.id);
            await this.schedulerProxy.createOneTimeSchedule(plan);
            await this.neptuneProxy.updateTransferPlan(plan, TransferPlanStatus.SCHEDULED);
        }
    }

    /**
     * Update an existing plan based on vertex' id.
     */
    private async updatePlan(body: ChangeLogEvent) {
        if (body.label === "inventory-plan") {
            const plan = await this.neptuneProxy.getInventoryPlan(body.id);
            await this.schedulerProxy.updateRecurringSchedule(plan);
        } else {
            const plan = await this.neptuneProxy.getTransferPlan(body.id);
            await this.schedulerProxy.updateOneTimeSchedule(plan);
        }
    }

    /**
     * Delete the existing schedule(s).
     */
    private async deletePlan(body: ChangeLogEvent) {
        if (body.label === "inventory-plan") {
            await this.schedulerProxy.deleteSchedule(body.id);
        } else {
            await this.schedulerProxy.deleteSchedule(body.id + "-ship");
            await this.schedulerProxy.deleteSchedule(body.id + "-arrival");
        }
    }

    /**
     * Check if the plan already exists before performing CRUD in order to handle potential duplicate SQS events.
     */
    private async checkIfPlanExist(id: string): Promise<boolean> {
        const plans = await this.schedulerProxy.listSchedules(id);
        let planExist;

        if (plans.Schedules && plans.Schedules.length > 0) {
            planExist = true;
        } else {
            planExist = false;
        }

        logger.debug(`Plan with ${id}'s existence is: `, planExist);
        return planExist;
    }
}
