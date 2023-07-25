// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export enum LocationType {
    MANUFACTURER = "manufacturer",
    DISTRIBUTOR = "distributor",
    SELLER = "seller"
}

export enum RuleType {
    MIN_QUANTITY = "min-quantity",
    MAX_QUANTITY = "max-quantity"
}

export enum InventoryPlanType {
    MANUFACTURING = "manufacturing",
    SALES = "sales"
}

export enum TransferPlanStatus {
    NEW = "new", // Assigned by API as a default value, both plans haven’t been executed
    SCHEDULED = "scheduled", // Updated by plan execution, both plans haven’t been executed but scheduled on EventBridge
    IN_TRANSIT = "in-transit", // Ship plan scheduler has been executed
    SUCCEED = "succeed", // Both plan schedulers have been executed
    FAILED = "failed" // Any of the plan fails the execution
}

export enum VertexLabel {
    LOCATION = "location",
    ITEM = "item",
    INVENTORY_PLAN = "inventory-plan",
    TRANSFER_PLAN = "transfer-plan",
    ITEM_RECORD = "item-record",
    FUTURE_DATE = "future-date",
    RULE = "rule",
    LOCATION_CUSTOM_FIELD = "location-custom-field",
    ITEM_CUSTOM_FIELD = "item-custom-field"
}
export enum EdgeDirection {
    IN = "in",
    OUT = "out"
}

export enum EdgeLabel {
    RECORDED = "recorded",
    TRANSFER = "transfer",
    PROJECTS = "projects",
    NEWLY_PROJECTS = "newly-projects",
    HAS_FUTURE_DATE = "has-future-date",
    GIVES = "gives",
    RECEIVES = "receives",
    UPDATES = "updates",
    TAKES = "takes",
    RESIDES = "resides",
    FOLLOWS = "follows",
    TRANSFERS = "transfers",
    VIOLATES = "violates"
}

export function isEnum<T>(object: T, value: any): value is T[keyof T] {
    return Object.values(object as {}).includes(value);
}
