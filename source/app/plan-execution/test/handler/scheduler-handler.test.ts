// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import {
    amount,
    currentInventoryItem,
    edge,
    id,
    inventoryPlanSchedule,
    lambdaArnConst,
    neptuneHostConst,
    neptunePortConst,
    previousInventoryItem,
    regionConst,
    schedulerRuleArnConst,
    sku,
    solutionId,
    transferPlan,
    transferPlanEndSchedule,
    transferPlanStartSchedule
} from "../helper/constants";
import { setup } from "../../index";
import { NeptuneProxy } from "../../src/proxy/neptune-proxy";
import { SchedulerHandler } from "../../src/handler/scheduler-handler";
import { EdgeDirection, EdgeLabel, TransferPlanStatus, VertexLabel } from "shared/neptune/model/constants";
import { NeptuneDB } from "shared/neptune/db/neptune-db";

describe("scheduler-handler", () => {
    beforeEach(() => {
        process.env.NEPTUNE_HOST = neptuneHostConst;
        process.env.NEPTUNE_ENDPOINT = neptuneHostConst;
        process.env.API_METRICS_SOLUTION_ID_ENV_KEY = solutionId;
        process.env.NEPTUNE_PORT = neptunePortConst;
        process.env.REGION = regionConst;
        process.env.LAMBDA_FUNCTION_ARN = lambdaArnConst;
        process.env.SCHEDULER_RULE_ARN = schedulerRuleArnConst;
        setup();
        jest.resetAllMocks();
    });

    test("will construct ok", () => {
        const schedulerHandler = new SchedulerHandler(new NeptuneProxy(new NeptuneDB()));

        expect(schedulerHandler).toBeDefined();
    });

    test("will handle inventory plan schedule called with correct payload", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = new NeptuneProxy(neptuneDb);
        const schedulerHandler = new SchedulerHandler(neptuneProxy);

        neptuneDb.getAllConnected_k_hop = jest.fn().mockImplementationOnce(() => {
            return [previousInventoryItem];
        }) as any;
        neptuneDb.updateVertex = jest.fn().mockImplementationOnce(() => {
            return currentInventoryItem;
        }) as any;
        neptuneDb.createVertex = jest.fn().mockImplementationOnce(() => {
            return currentInventoryItem;
        }) as any;
        neptuneDb.createEdge = jest.fn().mockImplementationOnce(() => {
            return edge;
        }) as any;

        schedulerHandler.handleInventoryPlanSchedule = jest.fn().mockImplementationOnce(() => {}) as any;
        await schedulerHandler.handleSchedulerInput(inventoryPlanSchedule);

        expect(schedulerHandler.handleInventoryPlanSchedule).toHaveBeenCalledTimes(1);
        expect(schedulerHandler.handleInventoryPlanSchedule).lastCalledWith(inventoryPlanSchedule);
    });

    test("will handle transfer plan schedule called with correct payload", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = new NeptuneProxy(neptuneDb);
        const schedulerHandler = new SchedulerHandler(neptuneProxy);

        neptuneDb.getAllConnected_k_hop = jest.fn().mockImplementationOnce(() => {
            return [previousInventoryItem];
        }) as any;
        neptuneDb.updateVertex = jest.fn().mockImplementationOnce(() => {
            return currentInventoryItem;
        }) as any;
        neptuneDb.createVertex = jest.fn().mockImplementationOnce(() => {
            return currentInventoryItem;
        }) as any;
        neptuneDb.createEdge = jest.fn().mockImplementationOnce(() => {
            return edge;
        }) as any;

        schedulerHandler.handleTransferPlanSchedule = jest.fn().mockImplementationOnce(() => {}) as any;
        await schedulerHandler.handleSchedulerInput(transferPlanStartSchedule);

        expect(schedulerHandler.handleTransferPlanSchedule).toHaveBeenCalledTimes(1);
        expect(schedulerHandler.handleTransferPlanSchedule).lastCalledWith(transferPlanStartSchedule);
    });

    test("will handle inventory plan schedule ok", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = NeptuneProxy.prototype;

        const getAllConnectedSpy = jest.spyOn(neptuneDb, "getAllConnected_k_hop");
        getAllConnectedSpy.mockReturnValue(Promise.resolve([previousInventoryItem]));
        const updateVertexSpy = jest.spyOn(NeptuneDB.prototype, "updateVertex");
        updateVertexSpy.mockReturnValue(Promise.resolve(currentInventoryItem));
        const createVertexSpy = jest.spyOn(NeptuneDB.prototype, "createVertex");
        createVertexSpy.mockReturnValue(Promise.resolve(currentInventoryItem));
        const createEdgeSpy = jest.spyOn(NeptuneDB.prototype, "createEdge");
        createEdgeSpy.mockReturnValue(Promise.resolve(edge));

        neptuneProxy.neptuneDb = neptuneDb;
        const schedulerHandler = new SchedulerHandler(neptuneProxy);
        await schedulerHandler.handleSchedulerInput(inventoryPlanSchedule);

        await expect(getAllConnectedSpy).toHaveBeenCalledTimes(1);
        await expect(getAllConnectedSpy).lastCalledWith(VertexLabel.INVENTORY_PLAN, VertexLabel.ITEM, id, [
            [EdgeLabel.UPDATES, EdgeDirection.OUT]
        ]);

        await expect(updateVertexSpy).toHaveBeenCalledTimes(1);
        const updateVertexCalls = updateVertexSpy.mock.calls;
        await expect(updateVertexCalls[0][0]).toEqual(VertexLabel.ITEM);
        await expect(updateVertexCalls[0][1]).toEqual({
            id: id,
            sku: sku,
            userDefinedFields: "",
            amount: amount + amount,
            dateEntered: expect.any(Date)
        });

        await expect(createVertexSpy).toHaveBeenCalledTimes(1);
        const createVertexCalls = createVertexSpy.mock.calls;
        await expect(createVertexCalls[0][0]).toEqual(VertexLabel.ITEM_RECORD);
        await expect(createVertexCalls[0][1]).toEqual({
            planId: id,
            dateFrom: expect.any(Date),
            dateTo: expect.any(Date),
            fromAmount: amount,
            toAmount: amount + amount
        });

        await expect(createEdgeSpy).toHaveBeenCalledTimes(1);
        await expect(createEdgeSpy).lastCalledWith(
            VertexLabel.ITEM,
            id,
            VertexLabel.ITEM_RECORD,
            id,
            EdgeLabel.RECORDED,
            {},
            true
        );
    });

    test("will handle transfer plan ship schedule ok", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = NeptuneProxy.prototype;

        const getByIddSpy = jest.spyOn(neptuneDb, "getById");
        getByIddSpy.mockReturnValue(Promise.resolve(transferPlan));
        const getAllConnectedSpy = jest.spyOn(neptuneDb, "getAllConnected_k_hop");
        getAllConnectedSpy.mockReturnValue(Promise.resolve([previousInventoryItem]));
        const updateVertexSpy = jest.spyOn(NeptuneDB.prototype, "updateVertex");
        updateVertexSpy.mockReturnValue(Promise.resolve(currentInventoryItem));
        const createVertexSpy = jest.spyOn(NeptuneDB.prototype, "createVertex");
        createVertexSpy.mockReturnValue(Promise.resolve(currentInventoryItem));
        const createEdgeSpy = jest.spyOn(NeptuneDB.prototype, "createEdge");
        createEdgeSpy.mockReturnValue(Promise.resolve(edge));

        neptuneProxy.neptuneDb = neptuneDb;
        const schedulerHandler = new SchedulerHandler(neptuneProxy);
        await schedulerHandler.handleSchedulerInput(transferPlanStartSchedule);

        await expect(getAllConnectedSpy).toHaveBeenCalledTimes(1);
        await expect(getAllConnectedSpy.mock.calls).toEqual([
            [VertexLabel.TRANSFER_PLAN, VertexLabel.ITEM, id, [[EdgeLabel.TAKES, EdgeDirection.OUT]]]
        ]);

        await expect(updateVertexSpy).toHaveBeenCalledTimes(2);
        const updateVertexCalls = updateVertexSpy.mock.calls;
        await expect(updateVertexCalls[0][0]).toEqual(VertexLabel.ITEM);
        await expect(updateVertexCalls[0][1]).toEqual({
            id: id,
            sku: sku,
            userDefinedFields: "",
            amount: amount - amount,
            dateEntered: expect.any(Date)
        });
        await expect(updateVertexCalls[1][0]).toEqual(VertexLabel.TRANSFER_PLAN);
        await expect(updateVertexCalls[1][1]).toEqual({
            id: id,
            arrivalDate: expect.any(Date),
            shipDate: expect.any(Date),
            status: TransferPlanStatus.IN_TRANSIT,
            transferAmount: amount
        });

        await expect(createVertexSpy).toHaveBeenCalledTimes(1);
        const createVertexCalls = createVertexSpy.mock.calls;
        await expect(createVertexCalls[0][0]).toEqual(VertexLabel.ITEM_RECORD);
        await expect(createVertexCalls[0][1]).toEqual({
            planId: id,
            dateFrom: expect.any(Date),
            dateTo: expect.any(Date),
            fromAmount: amount,
            toAmount: 0
        });

        await expect(createEdgeSpy).toHaveBeenCalledTimes(1);
        await expect(createEdgeSpy.mock.calls).toEqual([
            [VertexLabel.ITEM, id, VertexLabel.ITEM_RECORD, id, EdgeLabel.RECORDED, {}, true]
        ]);
    });

    test("will handle transfer plan arrival schedule ok", async () => {
        const neptuneDb = NeptuneDB.prototype;
        const neptuneProxy = NeptuneProxy.prototype;

        const getByIddSpy = jest.spyOn(neptuneDb, "getById");
        getByIddSpy.mockReturnValue(Promise.resolve(transferPlan));
        const getAllConnectedSpy = jest.spyOn(neptuneDb, "getAllConnected_k_hop");
        getAllConnectedSpy.mockReturnValue(Promise.resolve([previousInventoryItem]));
        const updateVertexSpy = jest.spyOn(NeptuneDB.prototype, "updateVertex");
        updateVertexSpy.mockReturnValue(Promise.resolve(currentInventoryItem));
        const createVertexSpy = jest.spyOn(NeptuneDB.prototype, "createVertex");
        createVertexSpy.mockReturnValue(Promise.resolve(currentInventoryItem));
        const createEdgeSpy = jest.spyOn(NeptuneDB.prototype, "createEdge");
        createEdgeSpy.mockReturnValue(Promise.resolve(edge));

        neptuneProxy.neptuneDb = neptuneDb;
        const schedulerHandler = new SchedulerHandler(neptuneProxy);
        await schedulerHandler.handleSchedulerInput(transferPlanEndSchedule);

        await expect(getAllConnectedSpy).toHaveBeenCalledTimes(1);
        await expect(getAllConnectedSpy.mock.calls).toEqual([
            [VertexLabel.TRANSFER_PLAN, VertexLabel.ITEM, id, [[EdgeLabel.GIVES, EdgeDirection.OUT]]]
        ]);

        await expect(updateVertexSpy).toHaveBeenCalledTimes(2);
        const updateVertexCalls = updateVertexSpy.mock.calls;
        await expect(updateVertexCalls[0][0]).toEqual(VertexLabel.ITEM);
        await expect(updateVertexCalls[0][1]).toEqual({
            id: id,
            sku: sku,
            userDefinedFields: "",
            amount: amount + amount,
            dateEntered: expect.any(Date)
        });
        await expect(updateVertexCalls[1][0]).toEqual(VertexLabel.TRANSFER_PLAN);
        await expect(updateVertexCalls[1][1]).toEqual({
            id: id,
            arrivalDate: expect.any(Date),
            shipDate: expect.any(Date),
            status: TransferPlanStatus.SUCCEED,
            transferAmount: amount
        });

        await expect(createVertexSpy).toHaveBeenCalledTimes(1);
        const createVertexCalls = createVertexSpy.mock.calls;
        await expect(createVertexCalls[0][0]).toEqual(VertexLabel.ITEM_RECORD);
        await expect(createVertexCalls[0][1]).toEqual({
            planId: id,
            dateFrom: expect.any(Date),
            dateTo: expect.any(Date),
            fromAmount: amount,
            toAmount: amount + amount
        });

        await expect(createEdgeSpy).toHaveBeenCalledTimes(1);
        await expect(createEdgeSpy.mock.calls).toEqual([
            [VertexLabel.ITEM, id, VertexLabel.ITEM_RECORD, id, EdgeLabel.RECORDED, {}, true]
        ]);
    });
});
