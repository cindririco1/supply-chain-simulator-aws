// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { PostTransferApi } from "../../../../../api/location/transfer-relationship/post/post-transfer-api";
import { VertexLabel, EdgeLabel, LocationType, EdgeDirection } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("postTransferApi", () => {
    it("constructor postTransferApi | success | object defined", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new PostTransferApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("execute postTransferApi | success | transfer edge created", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";
        const leadTime = 5;

        const mockCreateVertex = (db.createEdge = jest.fn().mockImplementationOnce(async () => {
            return { edge: "mockEdgeResponse" };
        }) as any);
        const api = new PostTransferApi(db);

        const mockValidateTransferRule = (api.validateTransferRule = jest.fn().mockImplementationOnce(async () => {
            return [true, ""];
        }) as any);

        // act
        const result = await api.execute(
            "",
            `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}", "leadTime": "${leadTime}" }`,
            {}
        );

        // assert
        expect(mockCreateVertex).toHaveBeenCalledTimes(1);
        expect(mockValidateTransferRule).toHaveBeenCalledTimes(1);
        expect(mockCreateVertex).toHaveBeenCalledWith(
            VertexLabel.LOCATION,
            fromLocationId,
            VertexLabel.LOCATION,
            toLocationId,
            EdgeLabel.TRANSFERS,
            {
                leadTime: "5"
            }
        );
    });

    it("validateTransferRule | success | valid from and to values", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";

        const api = new PostTransferApi(db);

        const mockGetById = (db.getById = jest
            .fn()
            .mockImplementationOnce(async () => {
                return undefined;
            })
            .mockImplementationOnce(async () => {
                return undefined;
            }) as any);

        const mockGetAllEdges = (db.getAllEdges = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);

        const mockGetPathBetweenVertices = (db.getPathBetweenVertices = jest.fn().mockImplementationOnce(async () => {
            return null;
        }) as any);

        // act
        const result = await api.validateTransferRule(fromLocationId, toLocationId);

        // assert
        expect(mockGetById).toHaveBeenCalledTimes(2);
        expect(mockGetAllEdges).toHaveBeenCalledTimes(1);
        expect(mockGetPathBetweenVertices).toHaveBeenCalledTimes(1);
        expect(mockGetAllEdges).toHaveBeenCalledWith(
            VertexLabel.LOCATION,
            fromLocationId,
            VertexLabel.LOCATION,
            toLocationId,
            EdgeDirection.OUT
        );
        expect(mockGetPathBetweenVertices).toHaveBeenCalledWith(
            VertexLabel.LOCATION,
            toLocationId,
            VertexLabel.LOCATION,
            fromLocationId,
            EdgeDirection.OUT
        );
        expect(result[0]).toEqual(true);
    });

    it("validateTransferRule | failure | incorrect fromLocation type | ", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";

        const item = {
            id: fromLocationId,
            type: LocationType.SELLER
        };

        const api = new PostTransferApi(db);

        const mockGetById = (db.getById = jest.fn().mockImplementationOnce(async () => {
            return item;
        }) as any);

        // act
        const result = await api.validateTransferRule(fromLocationId, toLocationId);

        // assert
        expect(mockGetById).toHaveBeenCalledTimes(1);
        expect(result[0]).toEqual(false);
    });

    it("validateTransferRule | failure | incorrect toLocation type", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";

        const item = {
            id: fromLocationId,
            type: LocationType.MANUFACTURER
        };

        const api = new PostTransferApi(db);

        const mockGetById = (db.getById = jest
            .fn()
            .mockImplementationOnce(async () => {
                return undefined;
            })
            .mockImplementationOnce(async () => {
                return item;
            }) as any);

        // act
        const result = await api.validateTransferRule(fromLocationId, toLocationId);

        // assert
        expect(mockGetById).toHaveBeenCalledTimes(2);
        expect(result[0]).toEqual(false);
    });

    it("validateTransferRule | failure | existing transfer edge", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";

        const api = new PostTransferApi(db);

        const mockGetById = (db.getById = jest
            .fn()
            .mockImplementationOnce(async () => {
                return undefined;
            })
            .mockImplementationOnce(async () => {
                return undefined;
            }) as any);

        const mockGetAllEdges = (db.getAllEdges = jest.fn().mockImplementationOnce(async () => {
            return [{ id: "test_edge", from: fromLocationId, to: toLocationId }];
        }) as any);

        // act
        const result = await api.validateTransferRule(fromLocationId, toLocationId);

        // assert
        expect(mockGetById).toHaveBeenCalledTimes(2);
        expect(mockGetAllEdges).toHaveBeenCalledTimes(1);
        expect(result[0]).toEqual(false);
    });

    it("validateTransferRule | failure | same from and to locations", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const fromLocationId = "test_same_location_id";
        const toLocationId = "test_same_location_id";

        const api = new PostTransferApi(db);

        const mockGetById = (db.getById = jest
            .fn()
            .mockImplementationOnce(async () => {
                return undefined;
            })
            .mockImplementationOnce(async () => {
                return undefined;
            }) as any);

        const mockGetAllEdges = (db.getAllEdges = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);

        // act
        const result = await api.validateTransferRule(fromLocationId, toLocationId);

        // assert
        expect(mockGetById).toHaveBeenCalledTimes(2);
        expect(mockGetAllEdges).toHaveBeenCalledTimes(1);
        expect(result[0]).toEqual(false);
    });

    it("validateTransferRule | failure | new edge creates a cycle", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";

        const api = new PostTransferApi(db);

        const mockGetById = (db.getById = jest
            .fn()
            .mockImplementationOnce(async () => {
                return undefined;
            })
            .mockImplementationOnce(async () => {
                return undefined;
            }) as any);

        const mockGetAllEdges = (db.getAllEdges = jest.fn().mockImplementationOnce(async () => {
            return undefined;
        }) as any);

        const mockGetPathBetweenVertices = (db.getPathBetweenVertices = jest.fn().mockImplementationOnce(async () => {
            return [{ id: "test_edge", from: toLocationId, to: fromLocationId }];
        }) as any);

        // act
        const result = await api.validateTransferRule(fromLocationId, toLocationId);

        // assert
        expect(mockGetById).toHaveBeenCalledTimes(2);
        expect(mockGetAllEdges).toHaveBeenCalledTimes(1);
        expect(mockGetPathBetweenVertices).toHaveBeenCalledTimes(1);
        expect(result[0]).toEqual(false);
    });

    it("execute postTransferApi | 400 bad request | transfer rules are not met before creating a transfer edge", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const fromLocationId = "test_from_location_id";
        const toLocationId = "test_to_location_id";
        const leadTime = 5;

        const mockCreateVertex = (db.createEdge = jest.fn().mockImplementationOnce(async () => {
            return { edge: "mockEdgeResponse" };
        }) as any);
        const api = new PostTransferApi(db);

        const mockValidateTransferRule = (api.validateTransferRule = jest.fn().mockImplementationOnce(async () => {
            return [false, "Transfer edges can not create a cycle"];
        }) as any);
        // act
        const result = await api.execute(
            "",
            `{ "fromLocationId": "${fromLocationId}", "toLocationId": "${toLocationId}", "leadTime": "${leadTime}" }`,
            {}
        );

        // assert
        expect(mockValidateTransferRule).toHaveBeenCalledTimes(1);
        expect(mockCreateVertex).toHaveBeenCalledTimes(0);
        expect(result.statusCode).toEqual(400);
    });

    it("execute postTransferApi | should throw an error if body is malformed", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostTransferApi(db);

        // act
        const response = await api.execute("", `{}`, {});

        // assert
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({ message: "Transfer Properties could not be extracted from body" });
    });

    it("execute postTransferApi | failure | transfer is missing arguments", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostTransferApi(db);
        const fromLocationId = "test_from_location_id";

        // act
        const response = await api.execute("", `{ "fromLocationId": "${fromLocationId}"}`, {});

        // assert
        expect(response.statusCode).toBe(400);
        expect(JSON.parse(response.body)).toEqual({ message: "Transfer Properties could not be extracted from body" });
    });

    it("execute postTransferApi | failure | body is null", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new PostTransferApi(db);

        // act/assert
        await expect(async () => {
            await api.execute("", null, {});
        }).rejects.toThrowError("Cannot read properties of null (reading 'fromLocationId')");
    });
});
