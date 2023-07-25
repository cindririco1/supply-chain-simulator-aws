// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";

import { NeptuneDB } from "shared/neptune/db/neptune-db";
import { EdgeLabel, VertexLabel } from "shared/neptune/model/constants";
import { NeptuneMapType } from "shared/neptune/db/neptune-types";
import { Rule } from "../../model/rule";
import { Violation } from "../../model/violation";
import { getErrorMessage } from "../../util/errorHandling";

/**
 * Holds all the methods for access violations (exceptions) in the db
 */
export class ViolationDataAccess {
    private db: NeptuneDB;
    private logger: Logger;

    constructor(database: NeptuneDB, logger: Logger) {
        this.db = database;
        this.logger = logger;
    }

    /**
     * Clears out all violations for an item
     * @param itemId id corresponding to item in db
     * @param ruleId id corresponding to the rule in db
     */
    public async deleteExistingViolations(itemId: string, ruleId: string) {
        await this.db.deleteEdge(VertexLabel.ITEM, itemId, VertexLabel.RULE, ruleId, EdgeLabel.VIOLATES);
    }

    /**
     * Creates a new violation which is an edge between Item and Rule
     * @param violation violation to be created
     */
    public async createViolation(violation: Violation) {
        await this.db.createEdge(
            VertexLabel.ITEM,
            violation.itemId,
            VertexLabel.RULE,
            violation.ruleId,
            EdgeLabel.VIOLATES,
            {
                exceptionOccurring: violation.exceptionOccuring
            }
        );
    }

    /**
     * Drops all violations (exceptions) for an item
     * @param itemId Item vertex id
     */
    public async removeViolations(itemId: string): Promise<void>{
        await this.db.deleteViolations(itemId);
    }

    /**
     * Gets all rules in db
     * @returns all rules in db
     */
    public async getRules(): Promise<Rule[]> {
        const rules = (await this.db.getAll(VertexLabel.RULE)) as Map<string, NeptuneMapType>[] | Rule[];
        return this.convertRuleListFromDB(rules);
    }

    /**
     * Inserts rule and returns in post-insert
     * @param rule rule to be inserted
     * @returns rule that was inserted
     */
    public async insertRule(rule: Rule): Promise<Rule> {
        const result = (await this.db.createVertex(VertexLabel.RULE, rule)) as Map<string, NeptuneMapType> | Rule;
        return this.convertRuleFromDB(result);
    }

    /**
     * Deletes all rules in DB
     */
    public async deleteAllRules(): Promise<void> {
        await this.db.dropAllVerticesByLabel(VertexLabel.RULE);
    }

    /**
     * Converts rules to a rule object type, works locally and deployed
     * @param rule rule object fresh from DB
     * @returns rule converted to rule object type
     */
    private convertRuleFromDB(rule: Map<string, NeptuneMapType> | Rule): Rule {
        try {
            if (Object.hasOwn(rule, "minAllowed")) {
                return rule as Rule;
            } else {
                const fromEntries = Object.fromEntries(rule as Map<string, NeptuneMapType>);
                return {
                    id: fromEntries.id as string,
                    minAllowed: fromEntries.minAllowed as number,
                    name: fromEntries.name as string
                } as Rule;
            }
        } catch (error) {
            const message = getErrorMessage(error);
            this.logger.error(`Failed conversion of rule: ${JSON.stringify(rule)}`);
            throw new Error(`Could not convert rule: ${message}`);
        }
    }

    /**
     * Converts rules to a rule object type as list, works locally and deployed
     * @param rules rule objects fresh from DB
     * @returns rules converted to rules object type
     */
    private convertRuleListFromDB(rules: Map<string, NeptuneMapType>[] | Rule[]): Rule[] {
        try {
            return rules.map(rule => {
                if (Object.hasOwn(rule, "minAllowed")) {
                    return rule as Rule;
                } else {
                    const fromEntries = Object.fromEntries(rule as Map<string, NeptuneMapType>);
                    return {
                        id: fromEntries.id as string,
                        minAllowed: fromEntries.minAllowed as number,
                        name: fromEntries.name as string
                    } as Rule;
                }
            });
        } catch (error) {
            const message = getErrorMessage(error);
            this.logger.error(`Failed conversion of rules: ${JSON.stringify(rules)}`);
            throw new Error(`Could not convert rules: ${message}`);
        }
    }
}
