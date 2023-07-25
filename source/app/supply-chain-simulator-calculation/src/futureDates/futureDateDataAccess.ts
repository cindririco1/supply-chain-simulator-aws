// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";

import { FutureDate } from "../model/futureDate";
import { EdgeLabel, VertexLabel } from "shared/neptune/model/constants";
import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { checkPromisesResult } from "../util/errorHandling";
import { NeptuneMapType } from "shared/neptune/db/neptune-types";

/**
 * Class used for accessing future dates in database
 */
export class FutureDateDataAccess {
    private db: NeptuneDB;
    private logger: Logger;

    /**
     * News up using database module, logger object
     * @param database database object in shared module
     * @param logger logger object extended prior to construction
     */
    constructor(database: NeptuneDB, logger: Logger) {
        this.db = database;
        this.logger = logger;
    }

    /**
     * Deletes supplied future dates
     * @param futureDates future dates to delete
     */
    public async deleteFutureDates(futureDates: FutureDate[]) {
        for await (const futureDate of futureDates) {
            if (futureDate.id != undefined) {
                await this.db.deleteById(VertexLabel.FUTURE_DATE, { id: futureDate.id });
            } else {
                this.logger.warn(`Tried to delete future date but not id found ${JSON.stringify(futureDate)}`);
            }
        }
    }

    /**
     * Updates a list of future dates in the database (assuming future dates have ids)
     * @param futureDates future dates to upsert in the database
     */
    public async updateFutureDates(futureDates: FutureDate[]) {
        for await (const futureDate of futureDates) {
            const vertex = {
                id: futureDate.id,
                date: futureDate.date,
                daysOut: futureDate.daysOut
            };
            await this.db.updateVertex(VertexLabel.FUTURE_DATE, vertex);
        }
    }

    /**
     * Creates future dates
     * @param futureDates future dates to newly create
     * @returns
     */
    public async createFutureDates(futureDates: FutureDate[]): Promise<FutureDate[]> {
        this.logger.debug(`Saving future dates`);
        const promises: Promise<Map<string, NeptuneMapType> | FutureDate>[] = [];
        for (const futureDate of futureDates) {
            const createFutureDate = this.db.createVertex<FutureDate>(VertexLabel.FUTURE_DATE, futureDate);
            promises.push(createFutureDate);
        }

        const result = await Promise.allSettled(promises);
        checkPromisesResult(result, "Problem creating future dates");

        return this.getAllFutureDates();
    }

    /**
     * Adds the "newly-projects" edge to all items from newly-made future dates
     * so that it kicks off the process for making new projections for the new
     * future date for all items
     * @param futureDates future dates that have just been created
     */
    public async associateFutureDatesToAllItems(futureDates: FutureDate[]) {
        const promises: Promise<boolean>[] = [];
        for (const futureDate of futureDates) {
            if (futureDate.id) {
                this.logger.debug(`Associating future date id ${futureDate.id}`);
                promises.push(
                    this.db.createEdgeForAll(
                        VertexLabel.FUTURE_DATE,
                        VertexLabel.ITEM,
                        EdgeLabel.NEWLY_PROJECTS,
                        futureDate.id,
                        {}
                    )
                );
            }
        }

        const result = await Promise.allSettled(promises);
        checkPromisesResult(result, "Associating future dates failed");
    }

    /**
     * Gets all future dates in the database
     * @returns List of all future dates in the db
     */
    public async getAllFutureDates(): Promise<FutureDate[]> {
        const futureDates = (await this.db.getAll(VertexLabel.FUTURE_DATE)) as
            | Map<string, NeptuneMapType>[]
            | FutureDate[];
        return this.convertListFromDB(futureDates);
    }

    /**
     * Converts future dates to typed objects, works local and deployed
     * @param futureDates future dates freshly retrieved from database
     * @returns
     */
    private convertListFromDB(futureDates: Map<string, NeptuneMapType>[] | FutureDate[]): FutureDate[] {
        try {
            return futureDates.map(futureDate => {
                if (Object.hasOwn(futureDate, "date")) {
                    return futureDate as FutureDate;
                } else {
                    const fromEntries = Object.fromEntries(futureDate as Map<string, NeptuneMapType>);
                    return {
                        id: fromEntries.id as string,
                        date: fromEntries.date as Date,
                        daysOut: fromEntries.daysOut as number
                    } as FutureDate;
                }
            });
        } catch (error) {
            this.logger.error(`Failed conversion of future dates: ${JSON.stringify(futureDates)}`);
            this.logger.error(`Future dates type: ${typeof futureDates}`);
            throw error;
        }
    }
}
