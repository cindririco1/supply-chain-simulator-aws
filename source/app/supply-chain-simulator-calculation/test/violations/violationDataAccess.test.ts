// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LoggerManager } from "../../src/util/logger";
import { expect, describe, test, jest } from "@jest/globals";
import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { ViolationDataAccess } from "../../src/calculation/violations/violationDataAccess";
import { Violation } from "../../src/model/violation";
import { NeptuneMapType } from "shared/neptune/db/neptune-types";

describe("violation data access", () => {
    const loggerManager = new LoggerManager();
    const logger = loggerManager.getLogger();
    test("will create violation", async () => {
        // Arrange
        const db = NeptuneDB.prototype;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.createEdge = jest.fn() as any;

        const violationDataAccess = new ViolationDataAccess(db, logger);
        const dateGenerated = new Date("2022-12-01");
        const violation: Violation = {
            itemId: "some-item-id",
            ruleId: "some-rule-id",
            exceptionOccuring: dateGenerated
        };

        // Act
        await violationDataAccess.createViolation(violation);

        // Assert
        expect(db.createEdge).toHaveBeenCalledWith("item", "some-item-id", "rule", "some-rule-id", "violates", {
            exceptionOccurring: dateGenerated
        });
    });

    test("Violation Data Access | success | will delete violations", async() => {
        // Arrange
        const db = NeptuneDB.prototype;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.deleteViolations = jest.fn() as any;

        const itemId = "test-item-id";
        const violationDataAccess = new ViolationDataAccess(db, logger);

        // Act
        await violationDataAccess.removeViolations(itemId);

        // Assert
        expect(db.deleteViolations).toHaveBeenCalledWith(itemId);
    });

    test("will get rules", async () => {
        // Arrange
        const db = NeptuneDB.prototype;
        const rule = {
            id: "some-id",
            name: "some-name",
            minAllowed: 0
        };

        const ruleV = new Map<string, NeptuneMapType>();
        ruleV.set("id", "some-id");
        ruleV.set("name", "some-name");
        ruleV.set("minAllowed", 0);
        db.getAll = jest.fn().mockImplementationOnce(() => {
            return [ruleV];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const violationDataAccess = new ViolationDataAccess(db, logger);

        // Act
        const rules = await violationDataAccess.getRules();

        // Assert
        expect(db.getAll).toHaveBeenCalledWith("rule");
        expect(rules.length).toBe(1);
        expect(rules[0]).toEqual(rule);
    });

    test("will insert rule", async () => {
        // Arrange
        const db = NeptuneDB.prototype;
        const rule = {
            id: "some-id",
            name: "some-name",
            minAllowed: 0
        };
        const ruleV = new Map<string, NeptuneMapType>();
        ruleV.set("id", "some-id");
        ruleV.set("name", "some-name");
        ruleV.set("minAllowed", 0);

        db.createVertex = jest.fn().mockImplementationOnce(() => {
            return ruleV;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any;

        const violationDataAccess = new ViolationDataAccess(db, logger);

        // Act
        const savedrule = await violationDataAccess.insertRule(rule);

        // Assert
        expect(db.createVertex).toHaveBeenCalledWith("rule", rule);
        expect(savedrule).toEqual(rule);
    });

    test("will delete all rules", async () => {
        // Arrange
        const db = NeptuneDB.prototype;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        db.dropAllVerticesByLabel = jest.fn() as any;

        const violationDataAccess = new ViolationDataAccess(db, logger);

        // Act
        await violationDataAccess.deleteAllRules();

        // Assert
        expect(db.dropAllVerticesByLabel).toHaveBeenCalledWith("rule");
    });
});
