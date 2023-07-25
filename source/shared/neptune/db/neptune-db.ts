// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataAccessInterface } from "./data-access-interface";
import { NeptuneQueryFactory } from "./neptune-query-factory";
import { process as gProcess } from "gremlin";
import { EdgeDirection, EdgeLabel, VertexLabel } from "../model/constants";
import { Vertex } from "../model/vertex";
import { Edge } from "../model/edge";
import { NeptuneMapType } from "./neptune-types";
import { CustomField } from "../model/custom-field";

const single = gProcess.cardinality.single;

export class NeptuneDB implements DataAccessInterface {
    neptuneQueryFactory: NeptuneQueryFactory;

    constructor(localMode = false) {
        this.neptuneQueryFactory = new NeptuneQueryFactory(localMode);
    }

    // Generic Query functions

    // Gets the vertex with the VertexLabel: label and the id: id
    async getById<T>(label: VertexLabel, id: string): Promise<Map<string, NeptuneMapType> | T> {
        const { query } = await this.neptuneQueryFactory.createQuery();

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            const node = await g.V(id).hasLabel(label).elementMap().next();
            return node;
        });
        return qResult.value;
    }

    // Gets a vertex starting from edge id and direction
    async getFromEdge(edgeId: string, edgeDirection: EdgeDirection): Promise<Map<string, NeptuneMapType>> {
        const { query } = await this.neptuneQueryFactory.createQuery();

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.E(edgeId);
            switch (edgeDirection) {
                case EdgeDirection.IN:
                    traversal = traversal.inV();
                    break;
                case EdgeDirection.OUT:
                    traversal = traversal.outV();
                    break;
                default:
                    throw TypeError(`Invalid edge direction: ${edgeDirection}`);
            }
            return traversal.elementMap().next();
        });
        return qResult.value;
    }

    // Get the path (if exists) between vertex with VertexLabel: startLabel and id: startId and vertex VertexLabel: endLabel and id: endId.
    async getPathBetweenVertices(
        startLabel: VertexLabel,
        startId: string,
        endLabel: VertexLabel,
        endId: string,
        edgeDirection: EdgeDirection
    ): Promise<Edge[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const __ = await this.neptuneQueryFactory.__;

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V(startId).hasLabel(startLabel);
            switch (edgeDirection) {
                case EdgeDirection.IN:
                    traversal = traversal.repeat(__.in().simplePath());
                    break;
                case EdgeDirection.OUT:
                    traversal = traversal.repeat(__.out().simplePath());
                    break;
                default:
                    throw TypeError(`Invalid edge direction: ${edgeDirection}`);
            }
            return traversal.until(__.hasId(endId).hasLabel(endLabel)).path().limit(1).next();
        });
        return qResult.value;
    }

    // Gets all vertices with the VertexLabel: label and the optional vertex properties: properties
    async getAll<T>(label: VertexLabel, vertex: Vertex = {}): Promise<Map<string, NeptuneMapType>[] | T[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V().hasLabel(label);
            type Key = keyof typeof vertex;
            Object.keys(vertex).forEach(prop_key => {
                traversal = traversal.has(prop_key, vertex[prop_key as Key]);
            });
            return await traversal.elementMap().toList();
        });
        return qResult;
    }

    // Gets all vertices with the VertexLabel: endLabel which have an edge of the specified direction between them and the VertexLabel: startLabel vertex with the id: startId
    async getAllConnected<T>(
        startLabel: VertexLabel,
        endLabel: VertexLabel,
        id: string,
        edgeDirection: EdgeDirection,
        vertex: Vertex = {}
    ): Promise<Map<string, NeptuneMapType>[] | T[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V(id).hasLabel(startLabel);
            switch (edgeDirection) {
                case EdgeDirection.IN:
                    traversal = traversal.in_();
                    break;
                case EdgeDirection.OUT:
                    traversal = traversal.out();
                    break;
                default:
                    throw TypeError(`Invalid edge direction: ${edgeDirection}`);
            }
            traversal = traversal.hasLabel(endLabel);
            type Key = keyof typeof vertex;
            Object.keys(vertex).forEach(prop_key => {
                traversal = traversal.has(prop_key, vertex[prop_key as Key]);
            });
            return await traversal.elementMap().toList();
        });
        return qResult;
    }

    // Deletes the vertex with the id: id and the VertexLabel: label
    async deleteById(label: VertexLabel, vertex: Vertex, transaction = false): Promise<boolean> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        await query(async (g: gProcess.GraphTraversalSource) => {
            return await g.V(vertex.id).hasLabel(label).drop().next();
        });
        return true;
    }

    // Create a new vertex with the VertexLabel: label and vertex properties: properties
    async createVertex<T>(
        label: VertexLabel,
        vertex: Vertex,
        transaction = false
    ): Promise<Map<string, NeptuneMapType> | T> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.addV(label);
            type Key = keyof typeof vertex;
            Object.keys(vertex).forEach(prop_key => {
                traversal = traversal.property(single, prop_key, vertex[prop_key as Key]);
            });
            return await traversal.next();
        });
        return qResult.value;
    }

    // Create a new vertex with the VertexLabel: label and unique property: uniqueProperty and vertex properties: properties
    // returns existing vertex if already found
    async createUniqueVertex(
        label: VertexLabel,
        uniqueProperty: { key: string; value: string },
        vertex: Vertex,
        transaction = false
    ): Promise<Map<string, NeptuneMapType>> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V().has(uniqueProperty.key, uniqueProperty.value);
            if (await traversal.hasNext()) {
                return await traversal.next();
            } else {
                traversal = g.addV(label).property(single, uniqueProperty.key, uniqueProperty.value);
                type Key = keyof typeof vertex;
                Object.keys(vertex).forEach(prop_key => {
                    traversal = traversal.property(single, prop_key, vertex[prop_key as Key]);
                });
                return await traversal.next();
            }
        });
        return qResult.value;
    }

    // Update a vertex with the VertexLabel: label and the id: id using the vertex properties: properties
    // returns qResult.value = null if no vertex with VertexLabel: label and id: id was found
    async updateVertex(label: VertexLabel, vertex: Vertex, transaction = false): Promise<Map<string, NeptuneMapType>> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V(vertex.id).hasLabel(label);
            type Key = keyof typeof vertex;
            Object.keys(vertex).forEach(prop_key => {
                if (prop_key != "id") traversal = traversal.property(single, prop_key, vertex[prop_key as Key]);
            });
            return await traversal.next();
        });
        return qResult.value;
    }

    async updateEdge(
        label: EdgeLabel,
        edge: Edge,
        properties: { [key: string]: string | number | Date }, // NOSONAR: typescript:S4323
        transaction = false
    ): Promise<Map<string, NeptuneMapType>> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.E(edge.id).hasLabel(label);
            Object.keys(properties).forEach(prop_key => {
                traversal = traversal.property(prop_key, properties[prop_key]);
            });
            return await traversal.next();
        });
        return qResult.value;
    }

    // Create edges between the start vertex and all vertices with end label
    async createEdgeForAll(
        startLabel: VertexLabel,
        endLabel: VertexLabel,
        edgeLabel: string,
        startId: string,
        properties: { [key: string]: string | number | Date } = {}, // NOSONAR: typescript:S4323
        transaction = false
    ): Promise<boolean> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g
                .V(startId)
                .hasLabel(startLabel)
                .as("startVertex")
                .V()
                .hasLabel(endLabel)
                .as("endVertex")
                .addE(edgeLabel)
                .from_("startVertex")
                .to("endVertex");
            Object.keys(properties).forEach(prop_key => {
                traversal = traversal.property(prop_key, properties[prop_key]);
            });
            return await traversal.next();
        });
        return true;
    }

    // Create a new edge between vertex with VertexLabel: startLabel and id: startId and vertex VertexLabel: endLabel and id: endId with the optional edge properties: properties
    // returns qResult.value = null if any of the start or end vertices don't exist.
    async createEdge(
        startLabel: VertexLabel,
        startId: string,
        endLabel: VertexLabel,
        endId: string,
        edgeLabel: string,
        properties: { [key: string]: string | number | Date } = {}, // NOSONAR: typescript:S4323
        transaction = false
    ): Promise<Edge> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g
                .V(startId)
                .hasLabel(startLabel)
                .as("startVertex")
                .V(endId)
                .hasLabel(endLabel)
                .as("endVertex")
                .addE(edgeLabel)
                .from_("startVertex")
                .to("endVertex");
            Object.keys(properties).forEach(prop_key => {
                traversal = traversal.property(prop_key, properties[prop_key]);
            });
            return await traversal.next();
        });
        return qResult.value;
    }

    async commitTransaction(): Promise<void> {
        await this.neptuneQueryFactory.commitTransaction();
    }
    async rollbackTransaction(): Promise<void> {
        await this.neptuneQueryFactory.rollbackTransaction();
    }

    // Get all edges between vertex with VertexLabel: startLabel and id: startId and vertex VertexLabel: endLabel and id: endId with the optional edge properties: properties.
    async getAllEdges(
        startLabel: VertexLabel,
        startId: string,
        endLabel: VertexLabel,
        endId: string,
        edgeDirection: EdgeDirection
    ): Promise<Edge[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V(startId).hasLabel(startLabel);
            switch (edgeDirection) {
                case EdgeDirection.IN:
                    traversal = traversal.inE().as("edge").outV();
                    break;
                case EdgeDirection.OUT:
                    traversal = traversal.outE().as("edge").inV();
                    break;
                default:
                    throw TypeError(`Invalid edge direction: ${edgeDirection}`);
            }
            traversal = traversal.hasId(endId).hasLabel(endLabel).select("edge");
            return await traversal.elementMap().toList();
        });
        return qResult;
    }

    // delete all edges between vertex with VertexLabel: startLabel and id: startId and vertex VertexLabel: endLabel and id: endId with edge label EdgeLabel: edgeLabel
    async deleteEdge(
        startLabel: VertexLabel,
        startId: string,
        endLabel: VertexLabel,
        endId: string,
        edgeLabel: EdgeLabel,
        transaction = false
    ): Promise<Map<string, NeptuneMapType>> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);
        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            const traversal = g
                .V(startId)
                .hasLabel(startLabel)
                .outE(edgeLabel)
                .as("e")
                .inV()
                .hasId(endId)
                .hasLabel(endLabel)
                .select("e")
                .drop();
            return await traversal.next();
        });
        return qResult;
    }

    // delete all edges between vertex with VertexLabel: startLabel and id: startId and vertex VertexLabel: endLabel and id: endId with edge label EdgeLabel: edgeLabel
    async deleteAllInEdgesFromVertex(
        startLabel: VertexLabel,
        startId: string,
        edgeLabel: EdgeLabel,
        transaction = false
    ): Promise<Map<string, NeptuneMapType>> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            const traversal = g.V(startId).hasLabel(startLabel).inE(edgeLabel).as("e").select("e").drop();
            return await traversal.next();
        });

        return qResult;
    }

    async dropAllVerticesByLabel(label: VertexLabel, transaction = false): Promise<boolean> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        await query(async (g: gProcess.GraphTraversalSource) => {
            return await g.V().hasLabel(label).drop().next();
        });
        return true;
    }

    // Gets all vertices with the VertexLabel: endLabel which have k hops edges of the specified label and direction between them and the VertexLabel: startLabel vertex with the id: id
    async getAllConnected_k_hop<T>(
        startLabel: VertexLabel,
        endLabel: VertexLabel,
        id: string,
        hops: [edgeLabel: EdgeLabel, edgeDirection: EdgeDirection][],
        vertex: Vertex = {}
    ): Promise<Map<string, NeptuneMapType>[] | T[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V(id).hasLabel(startLabel);
            for (const hop of hops) {
                const [edgeLabel, edgeDirection] = hop;
                switch (edgeDirection) {
                    case EdgeDirection.IN:
                        traversal = traversal.in_(edgeLabel);
                        break;
                    case EdgeDirection.OUT:
                        traversal = traversal.out(edgeLabel);
                        break;
                    default:
                        throw TypeError(`Invalid edge direction: ${edgeDirection}`);
                }
            }
            traversal = traversal.hasLabel(endLabel);
            type Key = keyof typeof vertex;
            Object.keys(vertex).forEach(prop_key => {
                traversal = traversal.has(prop_key, vertex[prop_key as Key]);
            });
            return await traversal.elementMap().toList();
        });
        return qResult;
    }

    async getEdgeVertex<T>(
        id: string,
        edgeLabel: EdgeLabel,
        edgeDirection: EdgeDirection
    ): Promise<Map<string, NeptuneMapType>[] | T[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            const sourceVertex = g.V(id);
            switch (edgeDirection) {
                case EdgeDirection.IN:
                    return sourceVertex.in_(edgeLabel).elementMap().toList();
                case EdgeDirection.OUT:
                    return sourceVertex.out(edgeLabel).elementMap().toList();
            }
        });
        return qResult;
    }

    async getEdgeBetweenVertices(
        edgeLabel: string,
        fromId: string,
        toId: string,
        properties: { [key: string]: string | number | Date } = {}
    ): Promise<Map<string, NeptuneMapType>> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const __ = await this.neptuneQueryFactory.__;

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V(fromId).bothE().where(__.otherV().hasId(toId));

            Object.keys(properties).forEach(prop_key => {
                traversal = traversal.has(prop_key, properties[prop_key]);
            });

            return traversal.elementMap().next();
        });
        return qResult.value;
    }

    async getAllLabelConnectedEdges_k_hop(
        startLabel: VertexLabel,
        endLabel: EdgeLabel,
        finalEdgeDirection: EdgeDirection,
        hops: [edgeLabel: EdgeLabel, edgeDirection: EdgeDirection][]
    ): Promise<Edge[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V().hasLabel(startLabel);
            for (const hop of hops) {
                const [edgeLabel, edgeDirection] = hop;
                switch (edgeDirection) {
                    case EdgeDirection.IN:
                        traversal = traversal.in_(edgeLabel);
                        break;
                    case EdgeDirection.OUT:
                        traversal = traversal.out(edgeLabel);
                        break;
                    default:
                        throw TypeError(`Invalid edge direction: ${edgeDirection}`);
                }
            }
            switch (finalEdgeDirection) {
                case EdgeDirection.IN:
                    traversal = traversal.inE(endLabel);
                    break;
                case EdgeDirection.OUT:
                    traversal = traversal.outE(endLabel);
                    break;
                default:
                    throw TypeError(`Invalid edge direction: ${finalEdgeDirection}`);
            }
            return await traversal
                .project("from", "edge", "to")
                .by(gProcess.statics.outV())
                .by(gProcess.statics.elementMap())
                .by(gProcess.statics.inV())
                .toList();
        });
        return qResult;
    }

    async getOutVertex<T>(startingVertexId: string, edgeLabel: string): Promise<Map<string, NeptuneMapType> | T> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            return g.V(startingVertexId).out(edgeLabel).elementMap().next();
        });
        return qResult.value;
    }

    // Custom Query functions

    // Gets invalid items with occuring edge property
    async getInvalidItems(locationId?: string, itemId?: string): Promise<Vertex[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const __ = await this.neptuneQueryFactory.__;

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V().hasLabel(VertexLabel.LOCATION);
            if (typeof locationId !== "undefined") {
                traversal = traversal.hasId(locationId);
            }
            traversal = traversal.inE(EdgeLabel.RESIDES).outV().hasLabel(VertexLabel.ITEM);
            if (typeof itemId !== "undefined") {
                traversal = traversal.hasId(itemId);
            }
            traversal = traversal
                .as("invalidItem")
                .outE(EdgeLabel.VIOLATES)
                .as("invalidEdge")
                .inV()
                .hasLabel(VertexLabel.RULE)
                .select("invalidItem")
                .by(__.elementMap())
                .dedup();
            return await traversal.toList();
        });
        return qResult;
    }

    // Gets Transfer Plans information for locationId (transferPlan + item + fromLocation + toLocation)
    async getTransferPlans(locationId: string, asFromLocation: boolean): Promise<Vertex[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const __ = await this.neptuneQueryFactory.__;

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g.V();
            if (asFromLocation) traversal = traversal.hasId(locationId);
            traversal = traversal
                .as("fromLocation")
                .inE(EdgeLabel.RESIDES)
                .outV()
                .hasLabel(VertexLabel.ITEM)
                .as("item")
                .inE(EdgeLabel.TAKES)
                .outV()
                .hasLabel(VertexLabel.TRANSFER_PLAN)
                .as("transferPlan")
                .outE(EdgeLabel.GIVES)
                .inV()
                .hasLabel(VertexLabel.ITEM)
                .outE(EdgeLabel.RESIDES)
                .inV();
            if (!asFromLocation) traversal = traversal.hasId(locationId);
            traversal = traversal
                .hasLabel(VertexLabel.LOCATION)
                .as("toLocation")
                .select("fromLocation", "toLocation", "item", "transferPlan")
                .by(__.elementMap());
            return await traversal.toList();
        });
        return qResult;
    }

    // Gets Inventory Plans information for locationId (InventoryPlan + item + location)
    async getInventoryPlans(locationId: string): Promise<Vertex[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const __ = await this.neptuneQueryFactory.__;

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g
                .V(locationId)
                .as("location")
                .inE(EdgeLabel.RESIDES)
                .outV()
                .hasLabel(VertexLabel.ITEM)
                .as("item")
                .inE(EdgeLabel.UPDATES)
                .outV()
                .hasLabel(VertexLabel.INVENTORY_PLAN)
                .as("inventoryPlan")
                .select("location", "item", "inventoryPlan")
                .by(__.elementMap());
            return await traversal.toList();
        });
        return qResult;
    }

    async getProjections(itemId: string): Promise<Edge[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const __ = await this.neptuneQueryFactory.__;

        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g
                .V(itemId)
                .outE(EdgeLabel.PROJECTS)
                .as("projection")
                .inV()
                .as("futureDate")
                .select("futureDate", "projection")
                .by(__.elementMap());
            return await traversal.toList();
        });
        return qResult;
    }

    async getTransferplansBetweenTransferEdge(fromLocationId: string, toLocationId: string): Promise<Vertex[]> {
        const { query } = await this.neptuneQueryFactory.createQuery();
        const qResult = await query(async (g: gProcess.GraphTraversalSource) => {
            let traversal = g
                .V(fromLocationId)
                .hasLabel(VertexLabel.LOCATION)
                .in_(EdgeLabel.RESIDES)
                .in_(EdgeLabel.TAKES)
                .as(EdgeLabel.TAKES)
                .V(toLocationId)
                .hasLabel(VertexLabel.LOCATION)
                .in_(EdgeLabel.RESIDES)
                .in_(EdgeLabel.GIVES)
                .as(EdgeLabel.GIVES)
                .select(EdgeLabel.TAKES)
                .where(EdgeLabel.TAKES, gProcess.P.eq(EdgeLabel.GIVES));

            return await traversal.elementMap().toList();
        });
        return qResult;
    }

    async deleteCustomField(vertexLabel: string, customField: CustomField, transaction = false): Promise<boolean> {
        const { query } = await this.neptuneQueryFactory.createQuery(transaction);

        await query(async (g: gProcess.GraphTraversalSource) => {
            return await g.V().hasLabel(vertexLabel).has("fieldName", customField.fieldName).drop().next();
        });
        return true;
    }

    async deleteViolations(itemId: string): Promise<boolean> {
        const { query } = await this.neptuneQueryFactory.createQuery();

        await query(async (g: gProcess.GraphTraversalSource) => {
            return await g.V(itemId).hasLabel(VertexLabel.ITEM).outE(EdgeLabel.VIOLATES).drop().next();
        });
        return true;
    }

    async close(): Promise<void> {
        await this.neptuneQueryFactory.closeConnection();
    }
}
