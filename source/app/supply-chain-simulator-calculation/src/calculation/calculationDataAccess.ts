// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";

import { Item } from "../model/item";
import { FutureDateEdge } from "../model/futureDateEdge";
import { EdgeDirection, EdgeLabel, VertexLabel } from "shared/neptune/model/constants";
import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { InventoryPlan } from "../model/inventoryPlan";
import { TransferPlan } from "../model/transferPlan";
import { getErrorMessage } from "../util/errorHandling";
import { DataChange } from "../types/queueMessageType";
import { ItemIdRetrieval } from "../model/itemIdRetrieval";
import { NeptuneMapType } from "shared/neptune/db/neptune-types";

/**
 * Class used for accessing calculations in database
 */
export class CalculationDataAccess {
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
     * Uses transaction methodology to save all projection edges in the database
     * @param projections projection objects that were updated previous to this
     */
    public async saveProjections(projections: FutureDateEdge[]): Promise<void> {
        try {
            for (const projection of projections) {
                await this.db.deleteEdge(
                    VertexLabel.ITEM,
                    projection.itemId,
                    VertexLabel.FUTURE_DATE,
                    projection.futureDateId,
                    EdgeLabel.PROJECTS,
                    true
                );
                await this.db.createEdge(
                    VertexLabel.ITEM,
                    projection.itemId,
                    VertexLabel.FUTURE_DATE,
                    projection.futureDateId,
                    EdgeLabel.PROJECTS,
                    {
                        inventoryEndingOnHand: projection.inventoryEndingOnHand,
                        supplyInTransit: projection.supplyInTransit,
                        supplyPlanned: projection.supplyPlanned,
                        inventoryBeginningOnHand: projection.inventoryBeginningOnHand,
                        demandPlanned: projection.demandPlanned,
                        dateGenerated: projection.dateGenerated
                    },
                    true
                );
            }
            await this.db.commitTransaction();
        } catch (e) {
            await this.db.rollbackTransaction();
            this.logger.error(`Error saving projections: ${e}`);
            throw Error("Error saving projections");
        }
    }

    /**
     * Gets full item object from db by id
     * @param itemId item id to use in getting full item object
     * @returns full item object
     */
    public async getItemById(itemId: string): Promise<Item> {
        try {
            const itemVertex = (await this.db.getById(VertexLabel.ITEM, itemId)) as Map<string, NeptuneMapType> | Item;

            if (itemVertex == undefined) {
                throw new Error(`itemId ${itemId} not found in database`);
            }

            return this.convertFromDB(itemVertex);
        } catch (e) {
            this.logger.error(`Could not get item from id ${itemId}: ${e}`);
            throw new Error(`Could not get item from id ${itemId}`);
        }
    }

    /**
     * Gets inventory plans for an item
     * @param itemId item id to use for getting it's inventory plans
     * @returns list of inventory plans corresponding to item id
     */
    public async getInventoryPlansForItem(itemId: string): Promise<InventoryPlan[]> {
        try {
            const inventoryPlans = (await this.db.getAllConnected<InventoryPlan>(
                VertexLabel.ITEM,
                VertexLabel.INVENTORY_PLAN,
                itemId,
                EdgeDirection.IN
            )) as InventoryPlan[];
            return this.convertInventoryPlanListFromDB(
                inventoryPlans as Map<string, NeptuneMapType>[] | InventoryPlan[]
            );
        } catch (e) {
            this.logger.error(`Could not get inventory plans from item ${itemId}: ${e}`);
            throw new Error(`Could not get inventory plans from item ${itemId}`);
        }
    }

    /**
     * Gets transfer plans for an item
     * @param itemId item id to use for getting it's transfer plans
     * @returns list of transfer plans corresponding to item id
     */
    public async getTransferPlansForItem(itemId: string): Promise<TransferPlan[]> {
        this.logger.debug(`Getting tplans for ${itemId}`);
        try {
            const takesTransferPlansRaw = (await this.db.getEdgeVertex<TransferPlan>(
                itemId,
                EdgeLabel.TAKES,
                EdgeDirection.IN
            )) as TransferPlan[];
            const takesTransferPlans = takesTransferPlansRaw.map(plan => {
                const transferPlan = this.convertTransferPlanFromDB(plan);
                transferPlan.transferringFrom = true;
                return transferPlan;
            });
            const givesTransferPlansRaw = (await this.db.getEdgeVertex<TransferPlan>(
                itemId,
                EdgeLabel.GIVES,
                EdgeDirection.IN
            )) as TransferPlan[];
            const givesTransferPlans = givesTransferPlansRaw.map(plan => {
                const transferPlan = this.convertTransferPlanFromDB(plan);
                transferPlan.transferringFrom = false;
                return transferPlan;
            });

            const concatenated = takesTransferPlans.concat(givesTransferPlans);
            return concatenated;
        } catch (e) {
            this.logger.error(`Could not get transfer plans from item ${itemId}: ${e}`);
            throw new Error(`Could not get transfer plans from item ${itemId}`);
        }
    }

    /**
     * Newly projects is an edge that's made when future dates turnover to make sure projections
     * get calculated as time goes on
     * @param dataChange the data change message that came in via the queue
     * @returns the item id and corresponding data change
     */
    public async deleteNewlyProjects(dataChange: DataChange): Promise<ItemIdRetrieval> {
        const itemIdRetrieval: ItemIdRetrieval = { itemId: dataChange.id, dataChange };
        try {
            await this.db.deleteAllInEdgesFromVertex(VertexLabel.ITEM, dataChange.id, EdgeLabel.NEWLY_PROJECTS);
        } catch (e) {
            const errorMsg = `Could not delete newly projects: ${e}`;
            this.logger.error(errorMsg);
            itemIdRetrieval.dataChange.errorMsg = errorMsg;
        }
        return itemIdRetrieval;
    }

    /**
     * Gets the item id from a newly projects edge change
     * @param dataChange the data change message that came in via the queue
     * @returns the item id and corresponding data change
     */
    public async getItemIdFromNewlyProjectsEdge(dataChange: DataChange): Promise<ItemIdRetrieval> {
        const itemIdRetrieval: ItemIdRetrieval = { dataChange: dataChange };
        try {
            const itemVertex = await this.db.getFromEdge(dataChange.id, EdgeDirection.IN);
            const item = this.convertFromDB(itemVertex);
            itemIdRetrieval.itemId = item.id;
        } catch (e) {
            const errorMsg = `Could not get item id from newly projects edge gives: ${e}`;
            this.logger.error(errorMsg);
            itemIdRetrieval.dataChange.errorMsg = errorMsg;
        }
        return itemIdRetrieval;
    }

    /**
     * Gets the item id from a transfer plan that gives
     * @param dataChange the data change message that came in via the queue
     * @returns the item id and corresponding data change
     */
    public async getItemIdFromTransferPlanGives(dataChange: DataChange): Promise<ItemIdRetrieval> {
        const itemIdRetrieval: ItemIdRetrieval = { dataChange: dataChange };

        try {
            const itemVertex = await this.db.getOutVertex<Item>(dataChange.id, EdgeLabel.GIVES);
            const item = this.convertFromDB(itemVertex as Map<string, NeptuneMapType> | Item);
            itemIdRetrieval.itemId = item.id;
        } catch (e) {
            const errorMsg = `Could not get item id from transfer plan gives: ${e}`;
            this.logger.error(errorMsg);
            itemIdRetrieval.dataChange.errorMsg = errorMsg;
        }

        return itemIdRetrieval;
    }

    /**
     * Gets the item id from a transfer plan that takes
     * @param dataChange the data change message that came in via the queue
     * @returns the item id and corresponding data change
     */
    public async getItemIdFromTransferPlanTakes(dataChange: DataChange): Promise<ItemIdRetrieval> {
        const itemIdRetrieval: ItemIdRetrieval = { dataChange: dataChange };

        try {
            const itemVertex = await this.db.getOutVertex<Item>(dataChange.id, EdgeLabel.TAKES);
            const item = this.convertFromDB(itemVertex as Map<string, NeptuneMapType> | Item);
            itemIdRetrieval.itemId = item.id;
        } catch (e) {
            const errorMsg = `Could not get item id from transfer plan takes: ${e}`;
            this.logger.error(errorMsg);
            itemIdRetrieval.dataChange.errorMsg = errorMsg;
        }

        return itemIdRetrieval;
    }

    /**
     * Gets the item id from a inventory plan
     * @param dataChange the data change message that came in via the queue
     * @returns the item id and corresponding data change
     */
    public async getItemIdFromInventoryPlan(dataChange: DataChange): Promise<ItemIdRetrieval> {
        const itemIdRetrieval: ItemIdRetrieval = { dataChange: dataChange };

        try {
            const itemVertices = await this.db.getAllConnected(
                VertexLabel.INVENTORY_PLAN,
                VertexLabel.ITEM,
                dataChange.id,
                EdgeDirection.OUT
            );
            if (itemVertices.length > 1) {
                throw new Error(
                    `Inventory plan id ${dataChange.id} associated with ${itemVertices.length} items. Should be no more than 1`
                );
            }

            const item = this.convertFromDB(itemVertices[0] as Map<string, NeptuneMapType> | Item);
            if (item.id == undefined) throw new Error("Item id cannot be undefined");
            return { itemId: item.id, dataChange: dataChange };
        } catch (e) {
            const errorMsg = `Could not get item id from inventory plan: ${e}`;
            this.logger.error(errorMsg);
            itemIdRetrieval.dataChange.errorMsg = errorMsg;
        }

        return itemIdRetrieval;
    }

    /**
     * Converts item object from db, works with local and deployed
     * @param item item object freshly returned from db
     * @returns converted item object
     */
    private convertFromDB(item: Map<string, NeptuneMapType> | Item): Item {
        try {
            if (Object.hasOwn(item, "sku")) {
                return item as Item;
            } else {
                const fromEntries = Object.fromEntries(item as Map<string, NeptuneMapType>);
                return {
                    id: fromEntries.id as string,
                    sku: fromEntries.sku as string,
                    amount: fromEntries.amount as number,
                    dateEntered: fromEntries.dateEntered as Date,
                    userDefinedFields: fromEntries.userDefinedFields as string
                } as Item;
            }
        } catch (error) {
            const message = getErrorMessage(error);
            throw new Error(`Could not convert item: ${message}`);
        }
    }

    /**
     * Converts inventory plan objects from db, works with local and deployed
     * @param inventoryPlans list of inventory plan objects fresh from db
     * @returns converted list of inventory plan objects
     */
    private convertInventoryPlanListFromDB(
        inventoryPlans: Map<string, NeptuneMapType>[] | InventoryPlan[]
    ): InventoryPlan[] {
        try {
            return inventoryPlans.map(inventoryPlan => {
                if (Object.hasOwn(inventoryPlan, "dailyRate")) {
                    return inventoryPlan as InventoryPlan;
                } else {
                    const fromEntries = Object.fromEntries(inventoryPlan as Map<string, NeptuneMapType>);
                    return {
                        startDate: fromEntries.startDate as Date,
                        endDate: fromEntries.endDate as Date,
                        turnoverHour: fromEntries.turnoverHour as string,
                        planType: fromEntries.planType as string,
                        dailyRate: fromEntries.dailyRate as number
                    } as InventoryPlan;
                }
            });
        } catch (error) {
            const message = getErrorMessage(error);
            this.logger.error(`Failed conversion of inventory plans: ${JSON.stringify(inventoryPlans)}`);
            throw new Error(`Could not convert inventory plans: ${message}`);
        }
    }

    /**
     * Converts transfer plan from db, works with local and deployed
     * @param transferPlan plan object from db
     * @returns converted transfer plan object
     */
    private convertTransferPlanFromDB(transferPlan: Map<string, NeptuneMapType> | TransferPlan): TransferPlan {
        try {
            if (Object.hasOwn(transferPlan, "transferAmount")) {
                return transferPlan as TransferPlan;
            } else {
                const fromEntries = Object.fromEntries(transferPlan as Map<string, NeptuneMapType>);
                return {
                    id: fromEntries.id as string,
                    shipDate: fromEntries.shipDate as Date,
                    arrivalDate: fromEntries.arrivalDate as Date,
                    transferAmount: fromEntries.transferAmount as number,
                    transferringFrom: fromEntries.transferringFrom as boolean
                } as TransferPlan;
            }
        } catch (error) {
            const message = getErrorMessage(error);
            this.logger.error(`Failed conversion of transfer plan: ${JSON.stringify(transferPlan)}`);
            throw new Error(`Could not convert transfer plan: ${message}`);
        }
    }
}
