// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export const getParameterCaseInsensitive = (object: object, key: string): any | undefined => {    
    const keyLower = key.toLowerCase();
    const realKey: string | undefined = Object.keys(object).find(k => k.toLowerCase() === keyLower);
    return realKey ? object[realKey as keyof typeof object] : undefined;
}; 