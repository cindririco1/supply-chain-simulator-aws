// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { logger } from "../util/logger";

// can be substituted in future with elasticache, dynamo, ssm or something else for long-lived tracking of commit nums
// and for scaling of ECS tasks to use centralized location of what has been processed
export class StreamCache {
    public latestCommitNum: number;

    public commitNumToSave: number;

    constructor() {
        const commitNum = process.env.COMMIT_NUM;
        if (commitNum) {
            this.latestCommitNum = Number(commitNum);
        } else {
            this.latestCommitNum = -1;
        }
    }

    save(): void {
        logger.debug("Saving commit");
        if (this.commitNumToSave) {
            this.latestCommitNum = this.commitNumToSave + 1;
        }
    }
}
