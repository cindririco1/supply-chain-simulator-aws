// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Destination } from "../destinations/destination-interface";
import { QueueDestination } from "../destinations/queue/queue-destination";
import { DataChange } from "../types/destination-message-type";
import { StreamRecord } from "../types/neptune-stream-types";
import { logger } from "../util/logger";

export class Router {
    public routing: Map<string, Map<string, Map<string, Destination[]>>>;
    private propertyToLabelMapping: Map<string, string>;

    constructor(calculationServiceQueueUrl: string, planExecutionQueueUrl: string) {
        const calculationDestination = new QueueDestination("Calcluation Service Queue", calculationServiceQueueUrl);
        const planExecutionDestination = new QueueDestination("Plan Execution Queue", planExecutionQueueUrl);

        // Example of Neptune Stream record
        // {
        //     "commitTimestamp": 1671485529310,
        //     "eventId": {
        //     "commitNum": 47,
        //     "opNum": 1
        //     },
        //     "data": {
        //     "id": "9ec29625-8a88-ae9d-4bbf-1aa8cf8dc904",
        //     "type": "e",
        //     "key": "label",
        //     "value": {
        //         "value": "Transfers",
        //         "dataType": "String"
        //     },
        //     "from": "dac29602-8fc8-1bdf-55a4-54c3462db150",
        //     "to": "04c29602-8fcb-5f12-f55a-1eb906e814f7"
        //     },
        //     "op": "REMOVE"
        // },

        this.routing = new Map();
        this.routing.set(
            "vp",
            new Map(
                Object.entries({
                    startDate: new Map(
                        Object.entries({
                            ADD: [calculationDestination, planExecutionDestination],
                            REMOVE: [planExecutionDestination]
                        })
                    ),
                    endDate: new Map(
                        Object.entries({
                            ADD: [calculationDestination, planExecutionDestination],
                            REMOVE: [planExecutionDestination]
                        })
                    ),
                    turnoverHour: new Map(
                        Object.entries({
                            ADD: [planExecutionDestination],
                            REMOVE: [planExecutionDestination]
                        })
                    ),
                    dailyRate: new Map(
                        Object.entries({
                            ADD: [calculationDestination, planExecutionDestination],
                            REMOVE: [planExecutionDestination]
                        })
                    ),
                    shipDate: new Map(
                        Object.entries({
                            ADD: [calculationDestination, planExecutionDestination],
                            REMOVE: [planExecutionDestination]
                        })
                    ),
                    arrivalDate: new Map(
                        Object.entries({
                            ADD: [calculationDestination, planExecutionDestination],
                            REMOVE: [planExecutionDestination]
                        })
                    ),
                    transferAmount: new Map(
                        Object.entries({
                            ADD: [calculationDestination, planExecutionDestination],
                            REMOVE: [planExecutionDestination]
                        })
                    ),
                    minAllowed: new Map(
                        Object.entries({
                            ADD: [calculationDestination],
                            REMOVE: []
                        })
                    ),
                    maxAllowed: new Map(
                        Object.entries({
                            ADD: [calculationDestination],
                            REMOVE: []
                        })
                    ),
                    amount: new Map(
                        Object.entries({
                            ADD: [calculationDestination],
                            REMOVE: []
                        })
                    ),
                    itemId: new Map(
                        Object.entries({
                            ADD: [calculationDestination],
                            REMOVE: [calculationDestination]
                        })
                    ),
                    fromItemId: new Map(
                        Object.entries({
                            ADD: [calculationDestination],
                            REMOVE: [calculationDestination]
                        })
                    ),
                    toItemId: new Map(
                        Object.entries({
                            ADD: [calculationDestination],
                            REMOVE: [calculationDestination]
                        })
                    )
                })
            )
        );

        this.routing.set(
            "e",
            new Map(
                Object.entries({
                    updates: new Map(Object.entries({ ADD: [], REMOVE: [] })),
                    takes: new Map(Object.entries({ ADD: [], REMOVE: [] })),
                    gives: new Map(Object.entries({ ADD: [], REMOVE: [] })),
                    "newly-projects": new Map(Object.entries({ ADD: [calculationDestination] }))
                })
            )
        );

        this.routing.set(
            "vl",
            new Map(
                Object.entries({
                    "inventory-plan": new Map(
                        Object.entries({ ADD: [planExecutionDestination], REMOVE: [planExecutionDestination] })
                    ),
                    "transfer-plan": new Map(
                        Object.entries({ ADD: [planExecutionDestination], REMOVE: [planExecutionDestination] })
                    )
                })
            )
        );

        this.propertyToLabelMapping = new Map();
        this.propertyToLabelMapping.set("startDate", "inventory-plan");
        this.propertyToLabelMapping.set("endDate", "inventory-plan");
        this.propertyToLabelMapping.set("turnoverHour", "inventory-plan");
        this.propertyToLabelMapping.set("planType", "inventory-plan");
        this.propertyToLabelMapping.set("dailyRate", "inventory-plan");
        this.propertyToLabelMapping.set("shipDate", "transfer-plan");
        this.propertyToLabelMapping.set("arrivalDate", "transfer-plan");
        this.propertyToLabelMapping.set("transferAmount", "transfer-plan");
        this.propertyToLabelMapping.set("minAllowed", "rule");
        this.propertyToLabelMapping.set("maxAllowed", "rule");
        this.propertyToLabelMapping.set("amount", "item");
        this.propertyToLabelMapping.set("itemId", "inventory-plan");
        this.propertyToLabelMapping.set("fromItemId", "transfer-plan");
        this.propertyToLabelMapping.set("toItemId", "transfer-plan");
    }

    public routeRecords(streamRecords: StreamRecord[]): void {
        logger.debug(`Routing ${streamRecords.length} records`);
        logger.debug("Arranging data change messages into optimal data structure for sending");

        streamRecords.forEach(sr => {
            const routingMap = this.routing.get(sr.data.type);
            if (routingMap) {
                if (sr.data.type === "vp") {
                    this.handleVertexPropertyChange(routingMap, sr);
                } else if (sr.data.type === "e" || sr.data.type === "vl") {
                    this.handleEdgeOrVertexLabelChange(routingMap, sr);
                } else {
                    logger.debug(`Do not have destinations for data type ${sr.data.type}`);
                }
            }
        });
    }

    private handleVertexPropertyChange(routingMap: Map<string, Map<string, Destination[]>>, sr: StreamRecord) {
        const destinations = this.getDestinations(routingMap, sr.data.key, sr.op);
        const label = this.propertyToLabelMapping.get(sr.data.key);
        this.sendDataChangeMessage(sr, label == undefined ? "not found" : label, destinations);
    }

    private handleEdgeOrVertexLabelChange(routingMap: Map<string, Map<string, Destination[]>>, sr: StreamRecord) {
        const destinations = this.getDestinations(routingMap, sr.data.value.value, sr.op);
        const label = sr.data.value.value;
        this.sendDataChangeMessage(sr, label, destinations);
    }

    private getDestinations(
        routingMap: Map<string, Map<string, Destination[]>>,
        key: string,
        operation: string
    ): Destination[] {
        const destinationsByOp = routingMap.get(key);
        if (destinationsByOp) {
            const destinations = destinationsByOp.get(operation);
            if (destinations) {
                return destinations;
            }
        }
        return [];
    }

    private sendDataChangeMessage(sr: StreamRecord, label: string, destinations: Destination[]) {
        logger.debug(
            `Routing data change message ${JSON.stringify(sr)} to destinations ${JSON.stringify(destinations)}`
        );
        // because number of destinations is low (2 or lower), not worried about potential n-squared here
        destinations.forEach(destination => {
            destination.send({
                id: sr.data.id,
                op: sr.op,
                key: sr.data.key,
                label: label,
                value: sr.data.value
            } as DataChange);
        });
    }
}
