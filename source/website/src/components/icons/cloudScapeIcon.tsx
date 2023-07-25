// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import Icon from "@cloudscape-design/components/icon";
import { IconName } from "../../models/enums/iconName";

export interface IconProps {
    iconName: IconName;
}
/**
 *
 * @param root0
 * @param root0.iconName
 */
export default function CloudScapeIcon({ iconName }: IconProps) {
    return (
        <>
            <Icon name={iconName} />
        </>
    );
}
