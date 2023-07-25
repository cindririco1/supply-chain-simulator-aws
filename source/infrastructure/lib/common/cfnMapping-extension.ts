// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CfnMapping } from "aws-cdk-lib";

declare module "aws-cdk-lib" {
    export interface CfnMapping {
        setDataMapValue(key: string, value: string): void;
        findInDataMap(key: string): string;
    }
}

CfnMapping.prototype.setDataMapValue = function (key: string, value: string): void {
    this.setValue("Data", key, value);
};

CfnMapping.prototype.findInDataMap = function (key: string): string {
    return this.findInMap("Data", key);
};
