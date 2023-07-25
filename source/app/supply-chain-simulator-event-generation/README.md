# Supply Chain Simulator on AWS Stream Poller

## Description

The entry to the backend calculation system of the solution is built on top of [Neptune Streams](https://docs.aws.amazon.com/neptune/latest/userguide/streams-using.html). This app is a long-lived ECS task(s) that repeatedly queries Neptune streams for changes to the data. It then compares the messages in the stream to pre-configured set of routing
rules to destinations. It looks at the "key" attribute in the record to know where to route. This tells the app
what property changed. Vertex label creations are ignored in addition to any property changed not written in the router's constructor code. The stream poller app caches what "commit number" it last processed in order to reduce duplicate messages.

### Example message returned from Neptune stream query

```
{
    lastEventId: {
        commitNum: 3,
        opNum: 26
    },
    lastTrxTimestamp: 1669907960096,
    format: "GREMLIN_JSON",
    records: [
        {
            commitTimestamp: 1669857689290,
            eventId: {
                commitNum: 1,
                opNum: 1
            },
            data: {
                id: "f8c265a3-1f37-1118-604c-f8b8a752778f",
                type: "vl",
                key: "label",
                value: {
                    value: "location",
                    dataType: "String"
                }
            },
            op: "ADD"
        },
        {
            commitTimestamp: 1669857689290,
            eventId: {
                commitNum: 1,
                opNum: 2
            },
            data: {
                id: "f8c265a3-1f37-1118-604c-f8b8a752778f",
                type: "vp",
                key: "description",
                value: {
                    value: "manufacturer node 1",
                    dataType: "String"
                }
            },
            op: "ADD"
        },
        {
            commitTimestamp: 1669857689290,
            eventId: {
                commitNum: 1,
                opNum: 2
            },
            data: {
                id: "f8c265a3-1f37-1118-604c-f8b8a752778f",
                type: "vl",
                key: "label",
                value: {
                    value: "InventoryPlan",
                    dataType: "String"
                }
            },
            op: "REMOVE"
        },
        {
            "commitTimestamp": 1671485529310,
            "eventId": {
            "commitNum": 47,
            "opNum": 1
            },
            "data": {
            "id": "9ec29625-8a88-ae9d-4bbf-1aa8cf8dc904",
            "type": "e",
            "key": "label",
            "value": {
                "value": "Transfers",
                "dataType": "String"
            },
            "from": "dac29602-8fc8-1bdf-55a4-54c3462db150",
            "to": "04c29602-8fcb-5f12-f55a-1eb906e814f7"
            },
            "op": "REMOVE"
        },
            op: "REMOVE"
        }],
    totalRecords: 40
}
```

Did edge REMOVE include from and to

## Building from source

### Pre-reqs

-   Install Docker

### Steps to build and run

-   `npm install --install-links`
-   `npm run build`
-   `docker build . -t streampoller`
-   `docker run -t streampoller`

### Example for pushing image to ECR

-   `aws ecr get-login-password --region $REGION --profile $AWS_PROFILE | docker login --username AWS --password-stdin $REPO`
-   `docker tag (local docker image id) $REPO/supply-chain-simulator-on-aws:streampoller`
-   `docker push $REPO/supply-chain-simulator-on-aws:streampoller`

Note an example for $REPO above would be (account id).dkr.ecr.(region).amazonaws.com
