// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Response } from "node-fetch";

// Generic method to handle exceptions when doing rest requests
export const fetchWithTry = async <T extends object>(
    fetchFn: () => Response | Promise<Response>,
    processFn: (resp: Response) => T | void
) => {
    const response = await fetchFn();

    if (!response.ok) {
        const json = await response.json();
        throw Error("Failed to call Api, response: " + JSON.stringify(json));
    }

    return await processFn(response);
};
