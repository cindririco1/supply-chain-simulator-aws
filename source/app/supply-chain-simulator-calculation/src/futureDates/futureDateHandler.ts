// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";

import { FutureDate } from "../model/futureDate";
import { FutureDateDataAccess } from "./futureDateDataAccess";

/**
 * Handles future date creation, according to amount of days out configured defaulting to 30
 * Creates, updates, deletes future dates
 */
export class FutureDateHandler {
    private futureDateDataAccess: FutureDateDataAccess;
    private logger: Logger;

    /**
     * constructs future date handler object
     * @param futureDateDataAccess object for accessing future dates in db
     * @param logger logger object, extended previously for module-included info
     */
    constructor(futureDateDataAccess: FutureDateDataAccess, logger: Logger) {
        this.futureDateDataAccess = futureDateDataAccess;
        this.logger = logger;
    }

    /**
     * Handles comparing all future dates to see which ones are now in the past
     * and need to be cleared out. Then it figures out, based on how many future
     * dates are not there, on what to insert
     * @param daysOut number of days out to make future date vertices
     */
    public async updateFutureDates(daysOut = 30): Promise<void> {
        this.logger.info("Running update of future date vertices");
        const futureDates = await this.getAllFutureDates();

        const futureDatesToDelete = this.filterToFutureDatesInPast(futureDates);

        const futureDateTurnoverAmount = this.calculateFutureDateTurnoverAmount(
            daysOut,
            futureDates,
            futureDatesToDelete
        );

        await this.processFutureDateTurnover(futureDates, futureDatesToDelete, futureDateTurnoverAmount, daysOut);
    }

    /**
     * Handles making sure all future dates are accurate and up-to-date
     * @param futureDates Currently existing future dates
     * @param futureDatesToDelete future dates in db that are now in the past
     * @param futureDateTurnoverAmount number of future dates that are going away and need to b e replaced
     * @param daysOut configured number of days out to make future dates
     */
    private async processFutureDateTurnover(
        futureDates: FutureDate[],
        futureDatesToDelete: FutureDate[],
        futureDateTurnoverAmount: number,
        daysOut: number
    ): Promise<void> {
        if (futureDateTurnoverAmount > 0) {
            // delete any in the past
            this.logger.debug(`Deleting ${futureDatesToDelete.length} future dates`);
            await this.futureDateDataAccess.deleteFutureDates(futureDatesToDelete);

            await this.updateExistingFutureDates(futureDates, futureDatesToDelete.length);

            await this.saveNewFutureDates(daysOut, futureDateTurnoverAmount, this.getLatestFutureDate(futureDates));
        }
    }

    /**
     * Gets and sorts currently existing future dates
     * @returns list of future dates currently in db, sorted
     */
    public async getAllFutureDates(): Promise<FutureDate[]> {
        // get existing futureDates
        const futureDates = await this.futureDateDataAccess.getAllFutureDates();
        this.logger.debug(`Received ${futureDates.length} futureDates`);

        futureDates.sort((a, b) => {
            return a.daysOut - b.daysOut;
        });

        return futureDates;
    }

    /**
     * Filters currently existing future dates to the ones in the past that now
     * need to be deleted
     * @param futureDates All future dates currently in question
     * @returns futureDates now in the past and to be deleted
     */
    private filterToFutureDatesInPast(futureDates: FutureDate[]): FutureDate[] {
        // check for any in the past
        const futureDatesToDelete: FutureDate[] = [];
        const now = new Date();
        for (const futureDate of futureDates) {
            this.logger.debug(`Comparing ${new Date(futureDate.date).getTime()} to ${now.getTime()}`);
            if (new Date(futureDate.date).getTime() < now.getTime()) {
                this.logger.debug(`Adding ${futureDate.date} to be deleted`);
                futureDatesToDelete.push(futureDate);
            }
        }
        return futureDatesToDelete;
    }

    /**
     * Gets the number of future dates that have to turn over (be deleted and replaced)
     * @param daysOut number of days out for future dates
     * @param futureDates total future date list currently in db
     * @param futureDatesToDelete future dates in the past
     * @returns number of future dates that need replacing
     */
    private calculateFutureDateTurnoverAmount(
        daysOut: number,
        futureDates: FutureDate[],
        futureDatesToDelete: FutureDate[]
    ): number {
        const missingNumberOfFutureDates = daysOut - futureDates.length;
        let futureDateTurnoverAmount = 0;
        if (missingNumberOfFutureDates > 0) {
            futureDateTurnoverAmount = daysOut - futureDates.length;
        }
        futureDateTurnoverAmount = futureDateTurnoverAmount + futureDatesToDelete.length;
        if (futureDateTurnoverAmount > daysOut) {
            futureDateTurnoverAmount = daysOut;
        }
        this.logger.debug(`futureDateTurnoverAmount - ${futureDateTurnoverAmount}`);
        return futureDateTurnoverAmount;
    }

    /**
     * Returns latest future date from a list of future dates
     * @param futureDates List of future dates
     * @returns latest future date in list
     */
    private getLatestFutureDate(futureDates: FutureDate[]): FutureDate {
        let latestFutureDate = futureDates.at(-1);
        if (!latestFutureDate) {
            latestFutureDate = {
                date: new Date(),
                daysOut: 0
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // edge case where latest future date is actually in the past
        if (latestFutureDate.date < today) {
            latestFutureDate = {
                date: today,
                daysOut: 1
            };
        }

        this.logger.debug(`Latest future date is ${latestFutureDate.date}`);
        return latestFutureDate;
    }

    /**
     * Creates new future dates according to how many have turned over
     * @param latestFutureDate future date at the end of daysOut
     * @param futureDateTurnoverAmount amount to add beyond latest future date
     * @param daysOutStart number index where latest future date is
     * @returns new future dates
     */
    private createNewFutureDates(
        latestFutureDate: FutureDate,
        futureDateTurnoverAmount: number,
        daysOutStart: number
    ): FutureDate[] {
        this.logger.debug(`futureDateTurnoverAmount: ${futureDateTurnoverAmount}`);
        this.logger.debug(`latestFutureDate: ${new Date(latestFutureDate.date).getDate()}`);
        const newFutureDates: FutureDate[] = [];
        // create any necessary new ones
        for (let i = 1; i <= futureDateTurnoverAmount; i++) {
            const newDate = new Date(latestFutureDate.date);
            newDate.setDate(newDate.getDate() + i);
            newDate.setHours(0);
            newDate.setMinutes(0);
            newDate.setSeconds(0);
            newDate.setMilliseconds(0);
            newFutureDates.push({
                date: newDate,
                daysOut: daysOutStart + i
            });
            this.logger.debug(`Creating new future date with date ${newDate} and daysOut ${i}`);
        }
        return newFutureDates;
    }

    /**
     * Updates existing future dates with their new "daysOut" number because time has passed
     * @param futureDates Existing future dates that don't need to be turned over
     * @param deletedDatesLength amount of dates deleted
     */
    private async updateExistingFutureDates(futureDates: FutureDate[], deletedDatesLength: number) {
        // reset all future dates daysOut
        let daysOutCounter = 0;
        for (const futureDate of futureDates) {
            daysOutCounter++;
            this.logger.debug(`Current days out for futureDate ${futureDate.date} is ${futureDate.daysOut}`);
            futureDate.daysOut = daysOutCounter - deletedDatesLength;
            this.logger.debug(`New days out is ${futureDate.daysOut}`);
        }

        // update existing future dates
        const futureDatesToUpdate = futureDates.slice(deletedDatesLength, futureDates.length);
        this.logger.debug(`Updating ${futureDatesToUpdate.length} future dates`);
        await this.futureDateDataAccess.updateFutureDates(futureDatesToUpdate);
    }

    /**
     * Creates and saves new future dates according to how many have turned over over time
     * @param daysOut total amount of future dates needed
     * @param futureDateTurnoverAmount amount of future dates that need to be made now
     * @param latestFutureDate future date most in the future
     */
    private async saveNewFutureDates(daysOut: number, futureDateTurnoverAmount: number, latestFutureDate: FutureDate) {
        const newFutureDates = this.createNewFutureDates(
            latestFutureDate,
            futureDateTurnoverAmount,
            daysOut - futureDateTurnoverAmount
        );

        // save new future dates
        // const newFutureDates = futureDates.slice(futureDates.length - futureDateTurnoverAmount, futureDates.length);
        this.logger.debug(`Creating ${newFutureDates.length} future dates`);
        const newFutureDatesSaved = await this.futureDateDataAccess.createFutureDates(newFutureDates);

        // Create edges Newly_Projects to all ItemIds for new future dates to generate re-calculation messages
        this.logger.debug(`Associating ${newFutureDatesSaved.length} future dates to all items`);
        await this.futureDateDataAccess.associateFutureDatesToAllItems(newFutureDatesSaved);
    }
}
