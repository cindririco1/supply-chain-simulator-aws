// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from "react";
import { jest, describe, it, expect } from "@jest/globals";
import { renderWithProviders } from "../../utils/test-utils";
import InteractionFlow from "../../../src/components/interactionFlow";
import { API, Auth } from "aws-amplify";

jest.mock("../../../src/components/shared", () => {
    return {
        loadGraph: jest.fn(() => {})
    };
});

global.ResizeObserver = jest.fn(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn()
}));

describe("Tests for Interaction Flow Component", () => {
    window.ResizeObserver = ResizeObserver;

    it("Render | success | chart created", () => {
        const { container } = renderWithProviders(
            <InteractionFlow
                nodes={[]}
                edges={[]}
                setNodes={() => {}}
                setEdges={() => {}}
                onNodesChange={() => {}}
                onEdgesChange={() => {}}
                onSelect={() => {}}
            />
        );

        expect(container).toBeDefined();
    });
});
