// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";

import { FutureDateEdge } from "../../../model/futureDateEdge";
import { TransferPlan } from "../../../model/transferPlan";
import { diffDate } from "../../../util/date";

export type inTransitTracker = {
    inTransit: number;
};

/**
 * Self-contained business logic class for generating calculations on projections that
 * transfer plans specifically affect
 */
export class TransferPlanCalculation {
    itemId: string;
    dateGenerated: Date;
    daysOut: number;
    logger: Logger;

    supplyPlannedTracker: Map<number, number>;
    supplyDemandTracker: Map<number, number>;
    supplyInTransitTracker: inTransitTracker[];

    /**
     * This class is scoped to one item's calculations at a time
     * @param itemId The db id corresponding to the item for which this is generating projections for
     * @param dateGenerated The timestamp to use on new projections
     * @param daysOut the number of days out to generate projections for
     * @param logger logger object
     */
    constructor(itemId: string, dateGenerated: Date, daysOut: number, logger: Logger) {
        this.itemId = itemId;
        this.dateGenerated = dateGenerated;
        this.daysOut = daysOut;
        this.supplyInTransitTracker = Array(daysOut).fill({ inTransit: 0 });
        this.supplyDemandTracker = new Map();
        this.supplyPlannedTracker = new Map();
        this.logger = logger;
    }

    /**
     * The only public method for which to do transfer plan calculations. It is solely reponsible for generating
     * these attributes: supplyInTransit, supplyPlanned, demandPlanned. SupplyInTransit is what shipments are en route
     * to arrive, supplyPlanned is shipments arriving that day, demandPlanned is shipments leaving that day. Transfer plans
     * also affect inventoryEndingOnHand which in turn affects inventoryBeginningOnHand
     * @param today Starting date from which to create future projections
     * @param transferPlans The transfer plans that an item contains which affect projections
     * @param projections projections that were previously initialized to item's current day amount and then had
     * inventory plan calculations put in
     * @returns newly altered projections
     */
    public analyzeTransferPlans(
        today: Date,
        transferPlans: TransferPlan[],
        projections: FutureDateEdge[]
    ): FutureDateEdge[] {
        for (const transferPlan of transferPlans) {
            this.logger.debug(`Analyzing ${JSON.stringify(transferPlan)}`);

            const shipDateDaysOut = diffDate(today, transferPlan.shipDate);
            this.logger.debug(`Ship days out - ${shipDateDaysOut})`);

            const arrivalDateDaysOut = diffDate(today, transferPlan.arrivalDate);
            this.logger.debug(`Arrival days out - ${arrivalDateDaysOut})`);

            if (transferPlan.transferringFrom === false) {
                const effectingDateIndex = arrivalDateDaysOut - 1;
                projections = this.updateInventoryEndingOnHand(
                    projections,
                    effectingDateIndex,
                    transferPlan.transferAmount
                );

                this.updateSupplyPlannedTracker(effectingDateIndex, transferPlan.transferAmount);

                const shipDateIndex = shipDateDaysOut - 1;
                const arrivalDateIndex = arrivalDateDaysOut - 1;

                this.updateSupplyInTransitTracker(
                    shipDateIndex,
                    arrivalDateIndex,
                    transferPlan.transferAmount,
                    projections.length
                );
            } else {
                const effectingDateIndex = shipDateDaysOut - 1;
                projections = this.updateInventoryEndingOnHand(
                    projections,
                    effectingDateIndex,
                    -transferPlan.transferAmount
                );

                this.updateSupplyDemandTracker(effectingDateIndex, transferPlan.transferAmount);
            }
        }

        projections = this.updateProjectionsSupplyAttributes(projections);

        return projections;
    }

    /**
     * Updates supply planned tracker with what day has a changed amount of supply planned.
     * Using a tracker dict object for performance reasons.
     * @param effectingDateIndex the integer corresponding to number of days out this affects supplyPlanned
     * @param transferPlanAmount the amount changing
     */
    private updateSupplyPlannedTracker(effectingDateIndex: number, transferPlanAmount: number): void {
        if (effectingDateIndex >= 0) {
            const supplyPlannedAmount = this.supplyPlannedTracker.get(effectingDateIndex);
            if (supplyPlannedAmount == undefined) {
                this.supplyPlannedTracker.set(effectingDateIndex, transferPlanAmount);
            } else {
                this.supplyPlannedTracker.set(effectingDateIndex, supplyPlannedAmount + transferPlanAmount);
            }
        }
    }

    /**
     * Updates supply demand tracker with what day has a changed amount of supply demand.
     * Using a tracker dict object for performance reasons.
     * @param effectingDateIndex the integer corresponding to number of days out this affects supplyDemanded
     * @param transferPlanAmount the amount changing
     */
    private updateSupplyDemandTracker(effectingDateIndex: number, transferPlanAmount: number) {
        if (effectingDateIndex >= 0) {
            const supplyDemandedAmount = this.supplyDemandTracker.get(effectingDateIndex);
            if (supplyDemandedAmount == undefined) {
                this.supplyDemandTracker.set(effectingDateIndex, transferPlanAmount);
            } else {
                this.supplyDemandTracker.set(effectingDateIndex, supplyDemandedAmount + transferPlanAmount);
            }
        }
    }

    /**
     * Tracking changes in supply-in-transit as we process transfer plans is more tricky than supplyPlanned
     * or supplyDemanded, this is because it's a date range. So the supply in transit tracker is a list corresponding
     * to number of daysOut, which gets updated in slices depending on the affecting transfer plan currently in process
     * when this method is called
     * @param shipDateIndex start date affecting the in transit numbers
     * @param arrivalDateIndex end date affecting the in transit numbers
     * @param transferPlanAmount the amount it changes for each day within the range
     * @param projectionsLength the length of all projections
     */
    private updateSupplyInTransitTracker(
        shipDateIndex: number,
        arrivalDateIndex: number,
        transferPlanAmount: number,
        projectionsLength: number
    ) {
        if (shipDateIndex < 0) {
            shipDateIndex = 0;
        }
        if (shipDateIndex > projectionsLength) {
            shipDateIndex = projectionsLength;
        }
        if (arrivalDateIndex < 0) {
            arrivalDateIndex = 0;
        }
        if (arrivalDateIndex > projectionsLength) {
            arrivalDateIndex = projectionsLength;
        }
        const pre = this.supplyInTransitTracker.slice(0, shipDateIndex);
        const changed = this.supplyInTransitTracker.slice(shipDateIndex, arrivalDateIndex).map(n => {
            return { inTransit: n.inTransit + transferPlanAmount };
        });
        const post = this.supplyInTransitTracker.slice(arrivalDateIndex, this.supplyInTransitTracker.length);
        this.supplyInTransitTracker = pre.concat(changed).concat(post);
    }

    /**
     * Once we've iterated once thru all transfer plans, we need to check the trackers to know what each day's
     * supply attributes are
     * @param projections the projections being altered throughout the class
     * @returns newly altered projections
     */
    private updateProjectionsSupplyAttributes(projections: FutureDateEdge[]): FutureDateEdge[] {
        for (let i = 0; i < projections.length; i++) {
            const supplyPlanned = this.supplyPlannedTracker.get(i);
            if (supplyPlanned) {
                projections[i].supplyPlanned = supplyPlanned;
            }

            const supplyDemanded = this.supplyDemandTracker.get(i);
            if (supplyDemanded) {
                projections[i].demandPlanned = supplyDemanded;
            }

            projections[i].supplyInTransit = this.supplyInTransitTracker[i].inTransit;
        }

        return projections;
    }

    /**
     * Changes inventoryEndingOnHand from the start of either shipDate or arrivalDate to the end of the projections
     * @param projections the projections being altered throughout the class
     * @param effectingDateIndex the start date from which projections are altered (if shipping, it was shipDate, if not it was arrivalDate)
     * @param transferAmount the amount that the plan changes
     * @returns newly altered projections
     */
    private updateInventoryEndingOnHand(
        projections: FutureDateEdge[],
        effectingDateIndex: number,
        transferAmount: number
    ): FutureDateEdge[] {
        if (effectingDateIndex < this.daysOut && effectingDateIndex < projections.length && effectingDateIndex >= 0) {
            for (let i = 0; i + effectingDateIndex < projections.length; i++) {
                projections[i + effectingDateIndex] = {
                    itemId: this.itemId,
                    futureDateId: projections[i + effectingDateIndex].futureDateId,
                    inventoryEndingOnHand: projections[i + effectingDateIndex].inventoryEndingOnHand + transferAmount,
                    inventoryBeginningOnHand: 0,
                    supplyInTransit: 0,
                    supplyPlanned: 0,
                    demandPlanned: 0,
                    dateGenerated: this.dateGenerated
                };
            }
        }
        return projections;
    }
}
