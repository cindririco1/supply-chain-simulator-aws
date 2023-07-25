// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Auth } from "aws-amplify";

/**
 *
 */
export async function generateToken() {
    const user = await Auth.currentAuthenticatedUser();
    const token = user.signInUserSession.idToken.jwtToken;
    return token;
}

/**
 * Gets token from cognito
 */

export const getRuntimeConfig = async () => {
    const runtimeConfig = await fetch("/runtimeConfig.json");
    return runtimeConfig.json();
};
