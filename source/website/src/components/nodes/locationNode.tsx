// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { memo } from "react";
import { LocationType } from "../../constants";
import { Handle, NodeProps, Position } from "reactflow";
import ErrorIcon from "../icons/errorIcon";

export type LocationNodeData = {
    title: string;
    locationType: LocationType;
    numberOfItems?: number;
    exception?: string;
};
/**
 * Custom Location Node use to populate the React Flow graph view
 */
export default memo(({ data }: NodeProps<LocationNodeData>) => {
    return (
        <>
            <div>
                <div>
                    <div>
                        <div className="title">{data.title}</div>
                        <div>{data.locationType}</div>
                        {data.exception !== undefined && (
                            <div className="exception">
                                <ErrorIcon /> {data.exception}
                            </div>
                        )}
                    </div>
                </div>
                <Handle type="source" position={Position.Bottom} />
                <Handle type="target" position={Position.Top} />
            </div>
        </>
    );
});
