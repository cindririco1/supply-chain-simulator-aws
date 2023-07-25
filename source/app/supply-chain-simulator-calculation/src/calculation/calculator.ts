// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";

import { ItemCalculation } from "./projections/itemCalculation";
import { DataChange } from "../types/queueMessageType";
import { FutureDate } from "../model/futureDate";
import { FutureDateEdge } from "../model/futureDateEdge";
import { CalculationDataAccess } from "./calculationDataAccess";
import { getErrorMessage } from "../util/errorHandling";
import { EdgeLabel, VertexLabel } from "shared/neptune/model/constants";
import { ViolationHandler } from "./violations/violationHandler";
import { ViolationDataAccess } from "./violations/violationDataAccess";
import { ItemIdRetrieval } from "../model/itemIdRetrieval";

export type ItemCalculationsResponse = {
    failures: DataChange[];
    successes: DataChange[];
};

/**
 * Manages the calculation process in general
 */
export class Calculator {
    private calculationDataAccess: CalculationDataAccess;
    private futureDates: FutureDate[];
    // a utility object to make it so we process an item's re-calculation no more than once per batch
    private pendingItemCalculationTracker: Map<string, DataChange[]>;
    private failures: DataChange[];
    private successes: DataChange[];
    private today: Date;
    private violationHandler: ViolationHandler;
    private logger: Logger;

    ITEM_ID = "itemId";
    FROM_ITEM_ID = "fromItemId";
    TO_ITEM_ID = "toItemId";

    /**
     * constructs calculator object
     * @param calculationDataAccess object for accessing calculations in db
     * @param violationDataAccess object for accessing violations in db
     * @param futureDates list of future dates, defaulted to 30 (days out)
     * @param logger logger object, extended previously for module-included info
     */
    constructor(
        calculationDataAccess: CalculationDataAccess,
        violationDataAccess: ViolationDataAccess,
        futureDates: FutureDate[],
        logger: Logger
    ) {
        this.calculationDataAccess = calculationDataAccess;
        this.violationHandler = new ViolationHandler(violationDataAccess, logger.child({ module: "ViolationHandler" }));
        this.futureDates = futureDates;
        this.logger = logger;
    }

    /**
     * As calculation process runs for multiple days, new future dates need to replace old ones
     * @param futureDates future dates to replace old ones
     */
    public setFutureDates(futureDates: FutureDate[]): void {
        this.futureDates = futureDates;
    }

    /**
     * Main method called by main index looping process. It first determines which item ids need to
     * be fully re-calculated (under set pending item calculations) and the runs each item's calculation
     * @param dataChanges List of messages coming from queue on what data changed in DB
     * @returns which data change calcs where successful and which failed
     */
    public async calculate(dataChanges: DataChange[]): Promise<ItemCalculationsResponse> {
        this.failures = [];
        this.successes = [];
        this.today = new Date();
        this.today.setHours(0, 0, 0, 0);

        if (dataChanges.length > 0) {
            await this.setPendingItemCalculations(dataChanges);
            await this.runItemCalculations();
        } else {
            this.logger.debug("Nothing to calculate");
        }

        return {
            failures: this.failures,
            successes: this.successes
        };
    }

    /**
     * Distills all the datachange messages down to a distinct set of items that we know
     * changed in this iteration of processing so that we reduce redundant calculations
     * @param dataChanges List of messages coming from queue on what data changed in DB
     */
    private async setPendingItemCalculations(dataChanges: DataChange[]): Promise<void> {
        this.logger.debug("Setting pending item calculations");

        this.pendingItemCalculationTracker = new Map<string, DataChange[]>();
        let itemIdRetrievalPromises: Promise<ItemIdRetrieval>[] = [];
        for await (const dc of dataChanges) {
            try {
                const label = dc.label.toLowerCase();
                switch (label) {
                    case VertexLabel.INVENTORY_PLAN:
                        itemIdRetrievalPromises.push(this.handleInventoryPlanDataChange(dc));
                        break;
                    case VertexLabel.TRANSFER_PLAN:
                        itemIdRetrievalPromises = itemIdRetrievalPromises.concat(this.handleTransferPlanDataChange(dc));
                        break;
                    case VertexLabel.ITEM:
                        itemIdRetrievalPromises.push(this.calculationDataAccess.deleteNewlyProjects(dc));
                        break;
                    case EdgeLabel.NEWLY_PROJECTS:
                        itemIdRetrievalPromises.push(this.calculationDataAccess.getItemIdFromNewlyProjectsEdge(dc));
                        break;
                    default:
                        this.logger.debug(`No matching case for label ${label}`);
                }
            } catch (error) {
                const message = getErrorMessage(error);
                this.logger.error(`Received error while composing changed item ids: ${message}`);
                dc.errorMsg = message;
                this.failures.push(dc);
            }
        }

        await this.executePendingItemPromises(itemIdRetrievalPromises);
    }

    private handleInventoryPlanDataChange(dc: DataChange): Promise<ItemIdRetrieval> {
        if (dc.key === this.ITEM_ID) {
            return this.getItemIdFromDataChangeValue(dc);
        } else {
            return this.calculationDataAccess.getItemIdFromInventoryPlan(dc);
        }
    }

    private handleTransferPlanDataChange(dc: DataChange): Promise<ItemIdRetrieval>[] {
        if (dc.key === this.FROM_ITEM_ID || dc.key === this.TO_ITEM_ID) {
            return [this.getItemIdFromDataChangeValue(dc)];
        } else {
            return [
                this.calculationDataAccess.getItemIdFromTransferPlanGives(dc),
                this.calculationDataAccess.getItemIdFromTransferPlanTakes(dc)
            ];
        }
    }

    private async getItemIdFromDataChangeValue(dc: DataChange): Promise<ItemIdRetrieval> {
        // specifically using value because on delete, vertex is gone so we can't use id against db post-delete
        return {
            itemId: dc.value.value,
            dataChange: dc
        };
    }

    /**
     * Executes promises that have been teed up to return an item id each
     * @param itemIdRetrievalPromises Promises that when executed will return item id each
     */
    private async executePendingItemPromises(itemIdRetrievalPromises: Promise<ItemIdRetrieval>[]): Promise<void> {
        this.logger.debug("Executing pending item promises");

        const results = await Promise.all(itemIdRetrievalPromises);
        for (const result of results) {
            if (result == undefined) {
                throw new Error(
                    "Data layer is misconfigured, all item id retrievals should return data change object despite failure"
                );
            }
            // no itemId means it failed and error message is on dataChange
            if (result.itemId == undefined) {
                this.failures.push(result.dataChange);
            } else {
                this.logger.debug("Successfully adding pending item calculation");
                this.addPendingItemCalculation(result.itemId, result.dataChange);
            }
        }
    }

    /**
     * Adds the itemId that changed to a dict if it wasn't in there already
     * @param itemId Item id corresponding to a data change
     * @param dataChange data change from the queue
     * @returns
     */
    private addPendingItemCalculation(itemId: string, dataChange: DataChange): Map<string, DataChange[]> {
        if (this.pendingItemCalculationTracker.has(itemId)) {
            this.pendingItemCalculationTracker.get(itemId)?.push(dataChange);
        } else {
            this.pendingItemCalculationTracker.set(itemId, [dataChange]);
        }
        return this.pendingItemCalculationTracker;
    }

    /**
     * Runs each item's calculations that we know are now distinct and not duplicated
     */
    private async runItemCalculations(): Promise<void> {
        this.logger.debug("Running item calculations");
        // current time complexity is N(number of items' plans)
        for (const [itemId, sourceDataChanges] of this.pendingItemCalculationTracker.entries()) {
            try {
                this.logger.debug(`Calculating projections for ${itemId}`);
                const projections = await this.calculateProjections(itemId);
                await this.calculationDataAccess.saveProjections(projections);
                await this.violationHandler.handleViolations(itemId, projections);
                this.successes = this.successes.concat(sourceDataChanges);
            } catch (error) {
                this.logger.error(`Received error while running calculations for item id ${itemId}: ${error}`);
                this.failures = this.failures.concat(sourceDataChanges);
            }
        }
        this.logger.debug("Finished running item calculations");
    }

    /**
     * Runs through the ItemCalculation class which contains all the business logic for
     * generating a calculation
     * @param itemId Item id for item whose projections are being calculated
     * @returns finished projections
     */
    private async calculateProjections(itemId: string): Promise<FutureDateEdge[]> {
        const item = await this.calculationDataAccess.getItemById(itemId);
        const inventoryPlans = await this.calculationDataAccess.getInventoryPlansForItem(itemId);
        const transferPlans = await this.calculationDataAccess.getTransferPlansForItem(itemId);

        const itemCalculation = new ItemCalculation(
            itemId,
            item.amount,
            this.futureDates,
            this.logger.child({ module: "ItemCalculation" })
        );

        return itemCalculation.calculateProjections(this.today, inventoryPlans, transferPlans);
    }
}
