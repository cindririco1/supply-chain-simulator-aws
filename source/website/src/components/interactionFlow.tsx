// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from "react";
import ReactFlow, { Controls } from "reactflow";
import { loadGraph } from "./shared";
import "reactflow/dist/style.css";
import "./interactionFlow.scss";
import locationNode from "./nodes/locationNode";
import { useAppSelector } from "../app/hooks/hooks";
import { selectAllLocations } from "../app/reducers/locationSlice";

interface Props {
    nodes: any[];
    edges: any[];
    setNodes: React.Dispatch<React.SetStateAction<any>>;
    setEdges: React.Dispatch<React.SetStateAction<any>>;
    onNodesChange: any;
    onEdgesChange: any;
    onSelect: (value: string) => void;
}
const nodeTypes = {
    location: locationNode
};

const InteractionFlow: React.FC<Props> = ({
    nodes,
    edges,
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    onSelect
}) => {
    const apiLocations = useAppSelector(selectAllLocations);
    const buttonWrapperStyle = {
        marginTop: "50%",
        zIndex: 4
    };
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            loadGraph(setNodes, setEdges);
        };
        fetchData();
        setLoading(false);
    }, [apiLocations]);

    if (loading) {
        return <div> Loading... </div>;
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const onNodeClick = async (event: any, node: any) => {
        onSelect(node.id);
    };
    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            preventScrolling
            onNodeClick={onNodeClick}
            onNodeDragStop={onNodeClick}
            fitView
            attributionPosition="top-right">
            <Controls />

            <div style={buttonWrapperStyle}></div>
        </ReactFlow>
    );
};

export default InteractionFlow;
