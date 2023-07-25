// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataChange } from "../types/queueMessageType";
import { CalculationQueue } from "./calculationQueueInterface";

/**
 * Utility class strictly for local development to quickly test
 * different types of messages
 */
export class LocalQueue implements CalculationQueue {
    public async receive(): Promise<DataChange[]> {
        console.log("In local queue, meant for local debugging, returning hardcoded datachanges");
        const dataChanges: DataChange[] = [
            {
                id: "490e0943-ed66-4313-a277-43c743e790b5",
                key: "amount",
                op: "ADD",
                label: "Item",
                value: { value: "120", dataType: "Int" },
                sqs: {
                    messageId: "382d7edc-724d-4236-9438-1cafdd56250a",
                    numberOfFailures: 0,
                    receiptHandle:
                        "AQEB/yu5ZczLxl8kAbYaywhbjDmVVuuOZcCHswv6FdLdks4k2x06UB4ZWAcyWfh8TKE5m/h7VTvzDXwzDxtEO0yt5Dyezsr8riCQ70/xOHNG9883YGZ+kU5UK3zPhC3M2T4fXcdtvbzYq10aQCJC+IWfz9jzKvlLJoziGbAusBlT9RhLcg6eEJrhOp5rcKFnvdYTtpZHVAztUk7tGUztVAzHwzuM+HEVlJNSt3aJErnNrmzR4ZoQKGFKJqxPLfTi1UIn5RW6MsdKypD7XtiaJXKyqvE3InK5ku6GhCgdrwZjNE6UXGRai2Ls85o6DInLChsCYOBca5RoM7XdyddjoY4jdO6YCXXvv74j06mIsnJlsdUboGWNk/XCxUWbwRKLa6fBnbGe2f0iZkH5zXHq4+1gNyeecWCytQ6/lMn/Q3xy8LCjw5h4jsXdn65xsINR8+AHtHYYrq3S0dv/+eaZsZ2UoQ=="
                }
            }
        ];
        return dataChanges;
    }

    public async deleteMessages(dataChanges: DataChange[]): Promise<void> {
        console.log(`Local deleting ${dataChanges.length}`);
    }

    public async sendMessagesWithFailure(dataChanges: DataChange[]): Promise<void> {
        console.log(`Local sending messages with failure ${dataChanges.length}`);
    }
}
