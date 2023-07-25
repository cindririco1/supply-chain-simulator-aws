// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// Types follow this JSON format as explained here: https://docs.aws.amazon.com/neptune/latest/userguide/streams-examples.html
// {
//   "lastEventId": {
//     "commitNum": 1,
//     "opNum": 1
//   },
//   "lastTrxTimestamp": 1571252030566,
//   "format": "NQUADS",
//   "records": [
//     {
//       "eventId": {
//         "commitNum": 1,
//         "opNum": 1
//       },
//       "commitTimestamp": 1571252030566,
//       "data": {
//         "stmt": "<https://test.com/s> <https://test.com/p> <https://test.com/o> .\n"
//       },
//       "op": "ADD",
//       "isLastOp", true
//     }
//   ],
//   "totalRecords": 1
// }

export type EventId = {
    commitNum: number;
    opNum: number;
};

type RecordData = {
    id: string;
    key: string;
    type: string;
    value: DataChangeValue;
};

export type DataChangeValue = {
    value: string;
    dataType: string;
};

export type StreamRecord = {
    eventId: EventId;
    commitTimestamp: number;
    data: RecordData;
    op: string;
    isLastOp: boolean;
};

export type StreamMessage = {
    lastEventId: EventId;
    lastTrxTimestamp: number;
    format: string;
    records: StreamRecord[];
    totalRecords: number;
};
