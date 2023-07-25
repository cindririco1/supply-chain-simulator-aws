# Supply Chain Simulator on AWS Calculation Service

## Building from source

### Pre-reqs

-   Install Docker

### Steps to build and run

-   `npm install --install-links`
-   `npm run build`
-   `docker build . -t calculationservice`
-   `docker run -t calculationservice`

NOTE: prep build is required because of the release process requiring all files to be in the same folder with the Dockerfile (no relative paths allowed)

### Example for pushing image to ECR

-   `aws ecr get-login-password --region $REGION --profile $AWS_PROFILE | docker login --username AWS --password-stdin $REPO`
-   `docker tag (local docker image id) $REPO/supply-chain-simulator-on-aws:calculationservice`
-   `docker push $REPO/supply-chain-simulator-on-aws:calculationservice`

Note an example for $REPO above would be (account id).dkr.ecr.(region).amazonaws.com

### Connecting to local gremlin

:remote connect tinkerpop.server conf/remote.yaml session
:remote console
graph = TinkerFactory.createModern()
g = traversal().withEmbedded(graph)

change conf/tinkergraph-empty.properties, gremlin.tinkergraph.vertexIdManager=LONG to UUID
