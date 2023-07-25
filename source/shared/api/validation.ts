// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import Logger from "../util/logger";

export const PROPERTIES_ERROR = "Properties could not be extracted from body";
export const UNEXPECTED_PROPERTIES_ERROR = "Unexpected/Missing properties in body";

/**
 * API method decorator to validate the body of a request
 * @param isModel Function to check if the body is a valid model
 * @param complete If true, checks that all model keys are present (ex: a post request), otherwise checks that all keys on obj are valid types(ex for a put/delete request)
 * @param hasId Returns false if body id presence does not match hasId
 * @param accessKeys If not null, the model is expected to be an object stored in the body at the index of the first key. Additional keys are expected to exist on the body.
 */
export const validateBody = (
    isModel: Function,
    complete: boolean,
    hasId: boolean,
    accessKeys: string[] | null = null
) => {
    return (target: any, _methodName: string, descriptor: PropertyDescriptor) => {
        const originalValue = descriptor.value;
        const logger: Logger = new Logger(target.constructor.name);
        descriptor.value = function (...args: any[]) {
            const body = args[1];
            let parsedVertex: any;
            if (body == null) throw Error("body is null");
            try {
                parsedVertex = JSON.parse(body);
            } catch (e) {
                logger.error(`Error parsing body: ${e}`);
                throw Error("Properties could not be extracted from body");
            }
            let missingProp = false;
            if (accessKeys !== null) {
                accessKeys.forEach(key => {
                    if (!parsedVertex.hasOwnProperty(key)) {
                        missingProp = true;
                    }
                });
                parsedVertex = parsedVertex[accessKeys[0]];
            }
            if (!isModel(parsedVertex, complete, hasId) || missingProp) {
                logger.error(
                    `Unexpected/Missing properties in body when using complete - ${complete}, hasId - ${hasId}, missingProp - ${missingProp}, accessKeys - ${JSON.stringify(
                        accessKeys
                    )} and vertex: ${JSON.stringify(parsedVertex)}`
                );
                throw Error("Unexpected/Missing properties in body");
            }
            return originalValue.apply(this, args);
        };
    };
};
