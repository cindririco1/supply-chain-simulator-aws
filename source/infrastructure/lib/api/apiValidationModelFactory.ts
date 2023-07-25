// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    IModel,
    IRequestValidator,
    JsonSchema,
    JsonSchemaType,
    MethodOptions,
    Model,
    RestApi
} from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import { LocationType } from "../../../shared/neptune/model/constants";

const ApplicationJsonContentType = "application/json";

//  Regex patterns for validating certain fields
const AlphaNumericPattern = "^[a-zA-Z0-9'\\-_ ]+$";
const GuidPattern = "^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$";
const DatePattern =
    "^([0-9]){4}(-|\\/){1}([0-9]){2}(-|\\/){1}([0-9]){2}(T([0-9]){2}:([0-9]){2}:([0-9]){2}\\.([0-9]){3}Z)?$";
//  Regex is not really suited to validate JSON strings, this will enforce a very basic JSON object
const JsonStringPattern = "^\\{.*\\}$";

export class ApiValidationModelFactory {
    Scope: Construct;
    RestApi: RestApi;
    constructor(scope: Construct, restApi: RestApi) {
        this.Scope = scope;
        this.RestApi = restApi;
    }

    ModelMap: Map<string, Model> = new Map();

    //#region LOCATION API VALIDATION

    locationSchemaProperties: JsonSchema = {
        type: JsonSchemaType.OBJECT,
        properties: {
            id: {
                type: JsonSchemaType.STRING,
                pattern: GuidPattern
            },
            description: {
                type: JsonSchemaType.STRING,
                pattern: AlphaNumericPattern
            },
            type: {
                type: JsonSchemaType.STRING,
                enum: [LocationType.MANUFACTURER, LocationType.DISTRIBUTOR, LocationType.SELLER]
            },
            userDefinedFields: {
                type: JsonSchemaType.STRING,
                pattern: JsonStringPattern
            }
        }
    };
    public GetLocationPostValidationModel = (): Model => {
        return this.GenerateModel("locationPostValidationModel", "location POST Validation Model", {
            ...this.locationSchemaProperties,
            required: ["description", "type", "userDefinedFields"],
            not: {
                required: ["id"]
            }
        });
    };
    public GetLocationPutDeleteValidationModel = (): Model => {
        return this.GenerateModel("locationPutDeleteValidationModel", "location PUT and DELETE Validation Model", {
            ...this.locationSchemaProperties,
            required: ["id"]
        });
    };

    //#endregion LOCATION API VALIDATION

    //#region CUSTOM FIELD API VALIDATION

    public GetCustomFieldValidationModel = (): Model => {
        return this.GenerateModel("customFieldModel", "custom-field Validation Model", {
            type: JsonSchemaType.OBJECT,
            definitions: {
                CustomFieldPostBodyModel: {
                    type: JsonSchemaType.OBJECT,
                    properties: {
                        fieldName: {
                            type: JsonSchemaType.STRING,
                            pattern: AlphaNumericPattern
                        },
                        fieldType: {
                            type: JsonSchemaType.STRING,
                            enum: ["text", "number", "date"]
                        }
                    },
                    required: ["fieldName", "fieldType"]
                },
                CustomFieldsModel: {
                    type: JsonSchemaType.OBJECT,
                    properties: {
                        new: {
                            type: JsonSchemaType.ARRAY,
                            items: {
                                ref: "#/definitions/CustomFieldPostBodyModel"
                            }
                        },
                        delete: {
                            type: JsonSchemaType.ARRAY,
                            items: {
                                ref: "#/definitions/CustomFieldPostBodyModel"
                            }
                        }
                    }
                }
            },
            properties: {
                customFields: {
                    ref: "#/definitions/CustomFieldsModel"
                }
            },
            required: ["customFields"]
        });
    };

    //#endregion CUSTOM FIELD API VALIDATION

    //#region TRANSFER PLAN API VALIDATION

    public GetLocationTransferPutPostValidationModel = (): Model => {
        return this.GenerateModel(
            "transferPutPostModel",
            "location/transfer-relationship Put and Post Validation Model",
            {
                type: JsonSchemaType.OBJECT,
                properties: {
                    fromLocationId: {
                        type: JsonSchemaType.STRING,
                        pattern: GuidPattern
                    },
                    toLocationId: {
                        type: JsonSchemaType.STRING,
                        pattern: GuidPattern
                    },
                    leadTime: {
                        type: JsonSchemaType.INTEGER
                    }
                },
                required: ["fromLocationId", "toLocationId", "leadTime"]
            }
        );
    };

    public GetLocationTransferDeleteValidationModel = (): Model => {
        return this.GenerateModel("transferDeleteModel", "location/transfer-relationship Delete Validation Model", {
            type: JsonSchemaType.OBJECT,
            properties: {
                fromLocationId: {
                    type: JsonSchemaType.STRING,
                    pattern: GuidPattern
                },
                toLocationId: {
                    type: JsonSchemaType.STRING,
                    pattern: GuidPattern
                }
            },
            required: ["fromLocationId", "toLocationId"]
        });
    };

    //#endregion TRANSFER PLAN API VALIDATION

    //#region ITEM API VALIDATION

    private ItemBodySchema: JsonSchema = {
        type: JsonSchemaType.OBJECT,
        properties: {
            amount: {
                type: JsonSchemaType.INTEGER
            },
            sku: {
                type: JsonSchemaType.STRING,
                pattern: AlphaNumericPattern
            },
            userDefinedFields: {
                type: JsonSchemaType.STRING,
                pattern: JsonStringPattern
            }
        }
    };

    private ItemPostBodySchema: JsonSchema = {
        ...this.ItemBodySchema,
        required: ["amount", "sku", "userDefinedFields"],
        not: {
            required: ["id"]
        }
    };

    public GetItemPostValidationModel = (): Model => {
        return this.GenerateModel("itemPostModel", "Item POST Validation Model", {
            type: JsonSchemaType.OBJECT,
            definitions: {
                ItemPostBodyModel: this.ItemPostBodySchema
            },
            properties: {
                locationId: {
                    type: JsonSchemaType.STRING,
                    pattern: GuidPattern
                },
                item: {
                    ref: "#/definitions/ItemPostBodyModel"
                }
            },
            required: ["locationId", "item"]
        });
    };

    public GetItemPutDeleteValidationModel = (): Model => {
        return this.GenerateModel("itemPutDeleteModel", "Item PUT and DELETE Validation Model", {
            ...this.ItemBodySchema,
            required: ["id"]
        });
    };

    //#endregion ITEM API VALIDATION

    //#region ITEMRECORD API VALIDATION

    public GetItemRecordValidationModel = (): Model => {
        return this.GenerateModel("itemRecordModel", "ItemRecord Validation Model", {
            type: JsonSchemaType.OBJECT,
            properties: {
                id: {
                    type: JsonSchemaType.STRING,
                    pattern: GuidPattern
                },
                dateFrom: {
                    type: JsonSchemaType.STRING,
                    pattern: DatePattern
                },
                dateTo: {
                    type: JsonSchemaType.STRING,
                    pattern: DatePattern
                },
                fromAmount: {
                    type: JsonSchemaType.NUMBER
                },
                toAmount: {
                    type: JsonSchemaType.NUMBER
                },
                planId: {
                    type: JsonSchemaType.STRING,
                    pattern: GuidPattern
                }
            },
            required: ["id"]
        });
    };

    //#endregion ITEMRECORD API VALIDATION

    //#region INVENTORY PLAN API VALIDATION

    private InventoryPlanSchema: JsonSchema = {
        type: JsonSchemaType.OBJECT,
        properties: {
            id: {
                type: JsonSchemaType.STRING,
                pattern: GuidPattern
            },
            startDate: {
                type: JsonSchemaType.STRING,
                pattern: DatePattern
            },
            endDate: {
                type: JsonSchemaType.STRING,
                pattern: DatePattern
            },
            turnoverHour: {
                type: JsonSchemaType.INTEGER
            },
            planType: {
                type: JsonSchemaType.STRING,
                enum: ["manufacturing", "sales"]
            },
            dailyRate: {
                type: JsonSchemaType.INTEGER
            }
        }
    };

    private InventoryPlanPostValidationSchema: JsonSchema = {
        ...this.InventoryPlanSchema,
        required: ["startDate", "endDate", "turnoverHour", "planType", "dailyRate"],
        not: {
            required: ["id"]
        }
    };

    private InventoryPlanPutDeleteValidationSchema: JsonSchema = {
        ...this.InventoryPlanSchema,
        required: ["id"]
    };

    public GetInventoryPlanPostValidationModel = (): Model => {
        return this.GenerateModel("inventoryPlanPostValidationModel", "Inventory Plan POST Validation Model", {
            type: JsonSchemaType.OBJECT,
            definitions: {
                InventoryPlan: this.InventoryPlanPostValidationSchema
            },
            properties: {
                itemId: {
                    type: JsonSchemaType.STRING,
                    pattern: GuidPattern
                },
                inventoryPlan: {
                    ref: "#/definitions/InventoryPlan"
                }
            },
            required: ["itemId", "inventoryPlan"]
        });
    };

    public GetInventoryPlanPutDeleteValidationModel = (): Model => {
        return this.GenerateModel(
            "inventoryPlanPutDeleteValidationModel",
            "Inventory Plan PUT and DELETE Validation Model",
            {
                type: JsonSchemaType.OBJECT,
                definitions: {
                    InventoryPlan: this.InventoryPlanPutDeleteValidationSchema
                },
                properties: {
                    itemId: {
                        type: JsonSchemaType.STRING,
                        pattern: GuidPattern
                    },
                    inventoryPlan: {
                        ref: "#/definitions/InventoryPlan"
                    }
                }
            }
        );
    };

    //#endregion INVENTORY PLAN API VALIDATION

    //#region  TRANSFER PLAN API VALIDATION

    private TransferPlanSchema: JsonSchema = {
        properties: {
            id: {
                type: JsonSchemaType.STRING,
                pattern: GuidPattern
            },
            shipDate: {
                type: JsonSchemaType.STRING,
                pattern: DatePattern
            },
            arrivalDate: {
                type: JsonSchemaType.STRING,
                pattern: DatePattern
            },
            transferAmount: {
                type: JsonSchemaType.INTEGER
            }
        }
    };
    private TransferPlanPostValidationSchema: JsonSchema = {
        ...this.TransferPlanSchema,
        required: ["shipDate", "arrivalDate", "transferAmount"],
        not: {
            required: ["id"]
        }
    };
    private TransferPlanPutDeleteValidationSchema: JsonSchema = {
        ...this.TransferPlanSchema,
        required: ["id"]
    };

    public GetTransferPlanPostValidationModel = (): Model => {
        return this.GenerateModel("transferPlanPostValidationModel", "Transfer Plan POST Validation Model", {
            type: JsonSchemaType.OBJECT,
            definitions: {
                TransferPlanModel: this.TransferPlanPostValidationSchema
            },
            properties: {
                fromLocationId: {
                    type: JsonSchemaType.STRING,
                    pattern: GuidPattern
                },
                toLocationId: {
                    type: JsonSchemaType.STRING,
                    pattern: GuidPattern
                },
                sku: {
                    type: JsonSchemaType.STRING,
                    pattern: AlphaNumericPattern
                },
                transferPlan: {
                    ref: "#/definitions/TransferPlanModel"
                }
            },
            required: ["fromLocationId", "toLocationId", "sku", "transferPlan"]
        });
    };

    public GetTransferPlanPutValidationModel = (): Model => {
        return this.GenerateModel("transferPlanPutValidationModel", "Transfer Plan PUT Validation Model", {
            type: JsonSchemaType.OBJECT,
            definitions: {
                TransferPlanModel: this.TransferPlanPutDeleteValidationSchema
            },
            properties: {
                transferPlan: {
                    ref: "#/definitions/TransferPlanModel"
                }
            },
            required: ["transferPlan"]
        });
    };

    public GetTransferPlanDeleteValidationModel = (): Model => {
        return this.GenerateModel("transferPlanDeleteValidationModel", "Transfer Plan DELETE Validation Model", {
            type: JsonSchemaType.OBJECT,
            definitions: {
                TransferPlanModel: this.TransferPlanPutDeleteValidationSchema
            },
            ref: "#/definitions/TransferPlanModel"
        });
    };

    //#endregion TRANSFER PLAN API VALIDATION

    private GenerateModel = (modelId: string, modelDescription: string, schema: JsonSchema): Model => {
        if (this.ModelMap.has(modelId)) {
            return <Model>this.ModelMap.get(modelId);
        }

        const model = new Model(this.Scope, modelId, {
            description: modelDescription,
            restApi: this.RestApi,
            schema
        });

        this.ModelMap.set(modelId, model);

        return model;
    };
}

export const GetMethodOptionsForBodyValidationBy = (
    requestValidator: IRequestValidator,
    validationModel: IModel
): MethodOptions => {
    return {
        requestModels: {
            [ApplicationJsonContentType]: validationModel
        },
        requestValidator
    };
};
