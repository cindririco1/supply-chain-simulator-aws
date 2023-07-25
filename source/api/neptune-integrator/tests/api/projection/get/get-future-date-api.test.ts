// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { NeptuneDB } from "neptune/db/neptune-db";
import { GetFutureDateApi } from "../../../../api/projection/get/get-future-date-api";
import { Location } from "neptune/model/location";
import { VertexLabel, LocationType } from "neptune/model/constants";
import { expect, describe, it, jest, afterEach } from "@jest/globals";

jest.mock("neptune/db/neptune-db");

describe("getFutureDateApi", () => {
    it("constructor getFutureDateApi | success | object defined", async () => {
        // arrange
        const db = NeptuneDB.prototype;

        // act
        const api = new GetFutureDateApi(db);

        // assert
        expect(api).toBeDefined();
    });

    it("execute getFutureDateApi | failure | should return 404 response", async () => {
        // arrange
        const db = NeptuneDB.prototype;
        const api = new GetFutureDateApi(db);

        // act
        const result = await api.execute("", null, {});

        // assert
        expect(result.statusCode).toEqual(404);
    });
});
