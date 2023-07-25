// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return String(error);
}
