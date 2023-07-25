// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export class PathParser {
    public static getLastItemInPath(path: string, expectedPathPartsAmount: number): string {
        const pathParts = path.split("/");
        if (pathParts.length !== expectedPathPartsAmount) {
            throw new Error("Invalid API path");
        }
        const id = pathParts.at(-1);
        if (id === undefined) {
            throw new Error("Invalid ID");
        }
        return id;
    }
}
