// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";

import { FutureDate } from "../../model/futureDate";
import { FutureDateEdge } from "../../model/futureDateEdge";
import { InventoryPlan } from "../../model/inventoryPlan";
import { TransferPlan } from "../../model/transferPlan";
import { InventoryPlanCalculation } from "./planCalculation/inventoryPlanCalculation";
import { TransferPlanCalculation } from "./planCalculation/transferPlanCalculation";

/**
 * Each item is calculated in it's entirety when each message comes through
 */
export class ItemCalculation {
    itemId: string;
    itemAmount: number;
    daysOut: number;
    futureDates: FutureDate[];
    dateGenerated: Date;
    logger: Logger;

    inventoryPlanCalculation: InventoryPlanCalculation;
    transferPlanCalculation: TransferPlanCalculation;

    /**
     * News up calculation process for an item
     * @param itemId the DB id corresponding to the item for which projections are being calculated
     * @param itemAmount the item's current day amount
     * @param futureDates list of date vertices in DB (defaults to 30 days out)
     * @param logger logger object, passed in because it is a child logger to append module info on each log
     * @param daysOut the amount of future dates, number of days out to make projections
     */
    constructor(itemId: string, itemAmount: number, futureDates: FutureDate[], logger: Logger, daysOut = 30) {
        this.itemId = itemId;
        this.itemAmount = itemAmount;
        this.daysOut = daysOut;
        this.logger = logger;

        futureDates.sort((a, b) => {
            return a.daysOut - b.daysOut;
        });
        this.futureDates = futureDates;
        this.dateGenerated = new Date();
        this.inventoryPlanCalculation = new InventoryPlanCalculation(
            itemId,
            this.dateGenerated,
            this.logger.child({ module: "InventoryPlanCalculation" })
        );
        this.transferPlanCalculation = new TransferPlanCalculation(
            itemId,
            this.dateGenerated,
            daysOut,
            this.logger.child({ module: "InventoryPlanCalculation" })
        );
    }

    /**
     * Calculates all these attributes for projections: inventoryEndingOnHand, inventoryBeginningOnHand,
     * supplyPlanned, supplyDemand, supplyInTransit
     * inventoryEndingOnHand - how much is left at the end of each future day
     * inventoryBeginningOnHand - how much is there at the beginning of each future day
     * supplyPlanned - how much is arriving on that future day
     * supplyDemand - how much is leaving on that future day
     * supplyInTransit - how much is in transit to that location on that future day (not to arrive that day)
     * @param today day from which projections are calculated going forward
     * @param inventoryPlans all the items' inventory plans
     * @param transferPlans all the items' transfer plans
     * @returns fully calculated projections
     */
    public calculateProjections(
        today: Date,
        inventoryPlans: InventoryPlan[],
        transferPlans: TransferPlan[]
    ): FutureDateEdge[] {
        this.logger.debug(`Generating calculations for item ${this.itemId} for date ${today}`);

        const initialProjections = this.createInitialProjections();
        this.logger.debug(`Initial projections - ${JSON.stringify(initialProjections)}`);

        const projectionsInvPlanUpdated = this.inventoryPlanCalculation.calculateInventoryEndingOnHand(
            today,
            inventoryPlans,
            initialProjections
        );
        const projectionsTranPlanUpdated = this.transferPlanCalculation.analyzeTransferPlans(
            today,
            transferPlans,
            projectionsInvPlanUpdated
        );

        const projections = this.calculateInventoryBeginningOnHand(projectionsTranPlanUpdated);

        return projections;
    }

    /**
     * Adds beginning on hand attribute to each projection, which is assumed to be the previous day's
     * ending on hand unless it's the first projection in which case it's the item's current day amount
     * @param projections projections that now have all attributes but beg. on hand
     * @returns projections with beginning on hand added
     */
    private calculateInventoryBeginningOnHand(projections: FutureDateEdge[]): FutureDateEdge[] {
        for (let i = 0; i < projections.length; i++) {
            if (i === 0) {
                projections[i].inventoryBeginningOnHand = this.itemAmount;
            } else {
                projections[i].inventoryBeginningOnHand = projections[i - 1].inventoryEndingOnHand;
            }
        }
        return projections;
    }

    /**
     * Starts off projections with blank attributes and ending on hand initialized to be
     * the item's current amount (which is true if no plans are created)
     * @returns newly created projection objects
     */
    private createInitialProjections(): FutureDateEdge[] {
        // make a hashset of date to value, initialized to item's value
        const projections: FutureDateEdge[] = [];
        for (const futureDate of this.futureDates) {
            if (futureDate.id != undefined) {
                const projection: FutureDateEdge = {
                    itemId: this.itemId,
                    futureDateId: futureDate.id,
                    inventoryEndingOnHand: this.itemAmount,
                    inventoryBeginningOnHand: 0,
                    supplyInTransit: 0,
                    supplyPlanned: 0,
                    demandPlanned: 0,
                    dateGenerated: this.dateGenerated
                };
                projections.push(projection);
            } else {
                throw new Error(`Must have id defined for future date vertex ${JSON.stringify(futureDate)}`);
            }
        }
        return projections;
    }
}
