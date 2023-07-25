// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Logger } from "pino";

import { FutureDateEdge } from "../../model/futureDateEdge";
import { Rule } from "../../model/rule";
import { Violation } from "../../model/violation";
import { ViolationDataAccess } from "./violationDataAccess";

/**
 * Handles creating, deleting, updating violations post-projection generation
 */
export class ViolationHandler {
    violationDataAccess: ViolationDataAccess;
    defaultRule: Rule;
    private logger: Logger;

    /**
     * Needs data access and logger to be newed up
     * @param violationDataAccess class for interacting with violation in db
     * @param logger logger object that has been extended previous to constructor
     */
    constructor(violationDataAccess: ViolationDataAccess, logger: Logger) {
        this.violationDataAccess = violationDataAccess;
        this.logger = logger;
    }

    /**
     * Forces only one rule in the database, compares all newly created projections against
     * this one rule. Removes violations to start before saving (to clean up resolved issues)
     * @param projections projections that were just generated previous to this class
     */
    public async handleViolations(itemId: string, projections: FutureDateEdge[]): Promise<void> {
        const rules = await this.violationDataAccess.getRules();
        // assuming just one rule right now, in the future we'll need a rules engine
        if (rules.length !== 1) {
            this.logger.warn(`Found ${rules.length} rules, which is not allowed. Resetting rules automatically`);
            await this.violationDataAccess.deleteAllRules();
            const defaultRule: Rule = {
                minAllowed: 0,
                name: "default"
            };
            this.defaultRule = await this.violationDataAccess.insertRule(defaultRule);
        } else {
            this.defaultRule = rules[0];
        }
        if (this.defaultRule.id == undefined) {
            throw new Error("Default rule id is undefined, can't proceed");
        }
        const violations = this.findViolations(projections, this.defaultRule.id);
        await this.violationDataAccess.removeViolations(itemId);
        await this.saveViolations(this.defaultRule.id, violations);
    }

    /**
     * Looks at all the projections and sees if they violate the one rule at any point
     * @param projections projections that were just generated previous to this class
     * @param ruleId id of the rule comparing to projections
     * @returns list of violations found
     */
    private findViolations(projections: FutureDateEdge[], ruleId: string): Violation[] {
        const newDate = new Date();
        newDate.setHours(0);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        newDate.setMilliseconds(0);

        const violations: Violation[] = [];
        for (let i = 0; i < projections.length; i++) {
            const exceptionOccurring = new Date(newDate);
            exceptionOccurring.setDate(newDate.getDate() + i);
            if (projections[i].inventoryEndingOnHand < this.defaultRule.minAllowed) {
                violations.push({
                    itemId: projections[i].itemId,
                    ruleId: ruleId,
                    exceptionOccuring: exceptionOccurring
                });
            }
        }

        return violations;
    }

    /**
     * Saves violations
     * @param ruleId the one rule db id
     * @param violations violations found
     */
    private async saveViolations(ruleId: string, violations: Violation[]): Promise<void> {
        const processedItemIds = new Set<string>();
        for (const violation of violations) {
            if (processedItemIds.has(violation.itemId) === false) {
                await this.violationDataAccess.deleteExistingViolations(violation.itemId, ruleId);
                processedItemIds.add(violation.itemId);
            }
            await this.violationDataAccess.createViolation(violation);
        }
    }
}
