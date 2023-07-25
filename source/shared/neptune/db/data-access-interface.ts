// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { EdgeDirection, VertexLabel } from "../model/constants";
import { Vertex } from "../model/vertex";
import { Edge } from "../model/edge";

export interface DataAccessInterface {
    getById(label: VertexLabel, id: string): Promise<Map<string, string | number | Date | boolean>>; // NOSONAR: typescript:S4323
    getAll(label: VertexLabel, vertex: Vertex): Promise<Map<string, string | number | Date | boolean>[]>; // NOSONAR: typescript:S4323
    getAllConnected(
        startLabel: VertexLabel,
        endLabel: VertexLabel,
        id: string,
        edgeDirection: EdgeDirection
    ): Promise<Map<string, string | number | Date | boolean>[]>; // NOSONAR: typescript:S4323
    deleteById(label: VertexLabel, vertex: Vertex): Promise<boolean>;
    createVertex(label: VertexLabel, vertex: Vertex): Promise<Map<string, string | number | Date | boolean>>; // NOSONAR: typescript:S4323
    createUniqueVertex(
        label: VertexLabel,
        uniqueProperty: { key: string; value: string },
        vertex: Vertex
    ): Promise<Map<string, string | number | Date | boolean>>; // NOSONAR: typescript:S4323
    updateVertex(label: VertexLabel, vertex: Vertex): Promise<Map<string, string | number | Date | boolean>>; // NOSONAR: typescript:S4323
    createEdge(
        startLabel: VertexLabel,
        startId: string,
        endLabel: VertexLabel,
        endId: string,
        edgeLabel: string
    ): Promise<Edge>;
}
