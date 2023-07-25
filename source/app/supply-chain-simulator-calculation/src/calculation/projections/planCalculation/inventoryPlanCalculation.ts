// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";
import { InventoryPlanType } from "shared/neptune/model/constants";

import { FutureDateEdge } from "../../../model/futureDateEdge";
import { InventoryPlan } from "../../../model/inventoryPlan";
import { diffDate } from "../../../util/date";

/**
 * Self-contained business logic class for generating calculations on projections that
 * inventory plans specifically affect
 */
export class InventoryPlanCalculation {
    itemId: string;
    dateGenerated: Date;
    logger: Logger;

    /**
     * This class is scoped to one item's calculations at a time
     * @param itemId The db id corresponding to the item for which this is generating projections for
     * @param dateGenerated The timestamp to use on new projections
     * @param logger logger object
     */
    constructor(itemId: string, dateGenerated: Date, logger: Logger) {
        this.itemId = itemId;
        this.dateGenerated = dateGenerated;
        this.logger = logger;
    }

    /**
     * The edges between Item vertices and FutureDate vertices represent "projections" which hold a number
     * of attributes you can see in the model folder. The main one inventory plans affect is "InventoryEndingOnHand"
     * which represents how much inventory for an item at a location at end of day will exist
     * @param today Starting date from which to create future projections
     * @param inventoryPlans The inventory plans that an item contains which affect projections
     * @param projections projections that were previously initialized to item's current day amount
     * @returns projections with InventoryEndingOnHand filled
     */
    public calculateInventoryEndingOnHand(
        today: Date,
        inventoryPlans: InventoryPlan[],
        projections: FutureDateEdge[]
    ): FutureDateEdge[] {
        // iterate thru inventory plans, updating hashset of date to value
        for (const inventoryPlan of inventoryPlans) {
            this.logger.debug(`Analyzing ${JSON.stringify(inventoryPlan)}`);
            this.logger.debug(`today is ${today}`);

            let startDateDaysOut = this.getDaysOut(today, inventoryPlan.startDate);
            this.logger.debug(`Start days out - ${startDateDaysOut}`);

            const endDateDaysOut = this.getDaysOut(today, inventoryPlan.endDate);
            this.logger.debug(`End days out - ${endDateDaysOut}`);

            // -1 to correct for cases when it includes today
            let inventoryPlanLength = endDateDaysOut - ((startDateDaysOut > 0 ? startDateDaysOut : 1) - 1);
            if (startDateDaysOut < 0) {
                startDateDaysOut = 0;
                inventoryPlanLength = endDateDaysOut;
            }
            const startDateIndex = startDateDaysOut - 1 > 0 ? startDateDaysOut - 1 : 0;
            const endDateIndex = endDateDaysOut - 1;

            //  For sales inventoryPlans, dailyRate coming in from UI and API will be positive
            //  This needs to be changed to a negative for proper projections
            if (inventoryPlan.planType === InventoryPlanType.SALES) {
                inventoryPlan.dailyRate *= -1;
            }

            projections = this.updateProjectionsAtEndDate(
                projections,
                inventoryPlan,
                inventoryPlanLength,
                endDateIndex
            );

            projections = this.updateProjectionsWithinInventoryPlanDateRange(
                projections,
                inventoryPlan,
                startDateIndex,
                endDateIndex
            );
        }

        return projections;
    }

    /**
     * Gets the difference in days between two dates excluding time-specific attributes
     * @param today Date from which to calculate days out
     * @param date Date to which to caclulate days out
     * @returns number of days difference
     */
    private getDaysOut(today: Date, date: Date): number {
        const truncatedDate = new Date(date);
        truncatedDate.setHours(0, 0, 0, 0);
        return diffDate(today, truncatedDate);
    }

    /**
     * The ending date projections affect all days after the plan ends because the generated/consumed
     * inventory still affects later days, just not on a changing rate
     * @param projections the projections being calculated throughout this class
     * @param inventoryPlan the specific inventory plan that is affecting calculations
     * @param inventoryPlanLength the length of days the inventory plan is affecting
     * @param endDateIndex the index from which to begin these alterations
     * @returns newly altered projections
     */
    private updateProjectionsAtEndDate(
        projections: FutureDateEdge[],
        inventoryPlan: InventoryPlan,
        inventoryPlanLength: number,
        endDateIndex: number
    ): FutureDateEdge[] {
        // starting at last day index, increase or decrease amount for rest of projections by length*dailyRate
        // For inventoryPlan.planType === SALES, dailyRate will be negative, and endDateChange will be negative
        const endDateChange = inventoryPlanLength * inventoryPlan.dailyRate;
        for (let i = endDateIndex; i < projections.length && i >= 0; i++) {
            projections[i] = {
                itemId: this.itemId,
                futureDateId: projections[i].futureDateId,
                inventoryEndingOnHand: projections[i].inventoryEndingOnHand + endDateChange,
                inventoryBeginningOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                demandPlanned: 0,
                dateGenerated: this.dateGenerated
            };
        }
        return projections;
    }

    /**
     * Updates the projections within the date range, which increase/decrease at a rate
     * day by day
     * @param projections the projections being calculated throughout this class
     * @param inventoryPlan the specific inventory plan that is affecting calculations
     * @param startDateIndex the index from which to begin these alterations
     * @param endDateIndex the index from which to end these alterations
     * @returns newly altered projections
     */
    private updateProjectionsWithinInventoryPlanDateRange(
        projections: FutureDateEdge[],
        inventoryPlan: InventoryPlan,
        startDateIndex: number,
        endDateIndex: number
    ): FutureDateEdge[] {
        for (
            let i = startDateIndex;
            i < endDateIndex && i >= 0 && startDateIndex < projections.length && i < projections.length;
            i++
        ) {
            //  For SALES inventoryPlan.planType, dailyRate is converted to be negative;
            //  `change` here will be negative as a result
            const change = (i - startDateIndex + 1) * inventoryPlan.dailyRate;

            projections[i] = {
                itemId: this.itemId,
                futureDateId: projections[i].futureDateId,
                inventoryEndingOnHand: projections[i].inventoryEndingOnHand + change,
                inventoryBeginningOnHand: 0,
                supplyInTransit: 0,
                supplyPlanned: 0,
                demandPlanned: 0,
                dateGenerated: this.dateGenerated
            };
        }
        return projections;
    }
}
