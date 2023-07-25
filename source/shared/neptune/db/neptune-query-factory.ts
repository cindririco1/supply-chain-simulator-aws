// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { OutgoingHttpHeaders } from "http2";

const gremlin = require("gremlin");
const retry = require("async-retry");
import { process as gProcess, driver } from "gremlin";
import { getDBHostString } from "./data-utils";
import { logger } from "../util/logger";

export class NeptuneQueryFactory {
    traversal = gremlin.process.AnonymousTraversalSource.traversal;
    Graph = gremlin.structure.Graph;
    __ = gremlin.process.statics;

    conn: driver.DriverRemoteConnection;
    g: gProcess.GraphTraversalSource;
    tx: gProcess.Transaction;
    localMode: boolean;

    url: string;
    headers: OutgoingHttpHeaders;

    RETRY_WAIT_MS = 100;

    constructor(localMode = false) {
        logger.debug("Initializing neptuneClient");
        this.localMode = localMode;
    }

    createRemoteConnection(url: string, header: {}) {
        const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
        let conn = new DriverRemoteConnection(url, {
            mimeType: "application/vnd.gremlin-v2.0+json",
            pingEnabled: false,
            headers: header
        });

        if (this.localMode) {
            conn = new DriverRemoteConnection(url, "g");
        }

        logger.debug(`DB url - ${url}`);

        conn._client._connection.on("log", (message: string) => {
            logger.debug(`connection message - ${message}`);
        });

        conn._client._connection.on("close", (code: number, message: string) => {
            logger.debug(`close - ${code} ${message}`);
            if (code == 1006) {
                throw new Error("Connection closed prematurely");
            }
        });

        return conn;
    }

    createGraphTraversalSource(conn: any) {
        try {
            return this.traversal().withRemote(conn);
        } catch (_e) {
            const err: Error = _e as Error;
            logger.error("Unrecoverable error: " + err);
        }
    }

    private async initializeConnection(url: string, headers: {}, transaction: boolean) {
        logger.debug("Initializing connection");
        this.conn = await this.createRemoteConnection(url, headers);
        logger.debug("Create Graph Traversal Source");
        this.g = await this.createGraphTraversalSource(this.conn);
        if (transaction) {
            this.tx = this.g.tx();
            this.g = this.tx.begin();
        }
    }

    public async closeConnection(): Promise<void> {
        if (this.conn != null) {
            await this.conn.close();
        } else {
            logger.warn("Tried closing null connection");
        }
    }

    private async setUrlAndHeaders(): Promise<void> {
        const { url, headers } = await getDBHostString(!this.localMode);
        this.url = url;
        this.headers = headers;
    }

    createQuery = async (transaction = false) => {
        return {
            query: async (fnc: any) => {
                if (this.url == null || this.headers == null) {
                    await this.setUrlAndHeaders();
                }
                if (this.conn == null) {
                    await this.initializeConnection(this.url, this.headers, transaction);
                }
                return retry(
                    async (bail: any, count: number) => {
                        try {
                            const result = await fnc(this.g);
                            return result;
                        } catch (_e) {
                            const err: Error = _e as Error;
                            await this.handleFailure(err, bail, count, transaction);
                        }
                    },
                    {
                        factor: 1,
                        retries: transaction ? 0 : 3
                    }
                );
            }
        };
    };

    private async handleFailure(err: Error, bail: any, count: number, transaction: boolean) {
        if (count > 0) logger.info("Retry attempt no: " + count);

        logger.warn(`Retrying after waiting ${this.RETRY_WAIT_MS} ms`);
        await new Promise(r => setTimeout(r, this.RETRY_WAIT_MS));

        // if unauthorized, refresh token
        if (err.message.startsWith("Unexpected server response: 403")) {
            await this.setUrlAndHeaders();
            await this.initializeConnection(this.url, this.headers, transaction);
        }

        if (err.message.startsWith("WebSocket is not open") && !transaction) {
            logger.info("Reopening connection");
            await this.conn.close();
            this.conn = this.createRemoteConnection(this.url, this.headers);
            this.g = this.createGraphTraversalSource(this.conn);
            throw err;
        } else if (err.message.includes("ConcurrentModificationException")) {
            logger.warn("Retrying query because of ConcurrentModificationException");
            throw err;
        } else if (err.message.includes("ReadOnlyViolationException")) {
            logger.warn("Retrying query because of ReadOnlyViolationException");
            throw err;
        } else {
            logger.warn("Unrecoverable error: " + err);
            return bail(err);
        }
    }

    public async commitTransaction() {
        if (this.tx && this.tx.isOpen) {
            await this.tx.commit();
            await this.tx.close();
            await this.conn.close();
        }
    }

    public async rollbackTransaction() {
        if (this.tx && this.tx.isOpen) {
            await this.tx.rollback();
            await this.tx.close();
            await this.conn.close();
        }
    }
}
