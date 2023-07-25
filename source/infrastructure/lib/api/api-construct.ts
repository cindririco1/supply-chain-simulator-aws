// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// https://docs.aws.amazon.com/solutions/latest/constructs/aws-cognito-apigateway-lambda.html
import { CognitoToApiGatewayToLambda } from "@aws-solutions-constructs/aws-cognito-apigateway-lambda";
import { Duration, Fn, RemovalPolicy, Stack } from "aws-cdk-lib";
import {
    AccessLogField,
    AccessLogFormat,
    IResource,
    LambdaIntegration,
    LogGroupLogDestination,
    Method,
    Resource,
    ResponseType
} from "aws-cdk-lib/aws-apigateway";
import { AccountRecovery, CfnUserPoolUser } from "aws-cdk-lib/aws-cognito";
import { SecurityGroup, Vpc } from "aws-cdk-lib/aws-ec2";
import { Effect, Policy, PolicyStatement, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { CfnPermission, Code, Runtime } from "aws-cdk-lib/aws-lambda";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { NagSuppressions } from "cdk-nag";
import { Construct } from "constructs";
import { API_METRICS_SOLUTION_ID_ENV_KEY, ApiMetricsConstructProps } from "../../../shared/api/apiMetrics";
import { ApiValidationModelFactory, GetMethodOptionsForBodyValidationBy } from "./apiValidationModelFactory";

enum ValidationParameterEnum {
    path = "path",
    querystring = "querystring",
    header = "header"
}

const GetRequestParameterKeyBy = (validationParameterEnum: ValidationParameterEnum, name: string) => {
    return `method.request.${validationParameterEnum}.${name}`;
};

export interface ApiConstructProps extends ApiMetricsConstructProps {
    readonly email: string;
    readonly vpc: Vpc;
    readonly ingressSecurityGroup: SecurityGroup;
    readonly sourceCodeBucket: IBucket;
    readonly sourceCodePrefix: string;
    readonly distributionDomainName: string;
    readonly neptuneClusterArn: string;
    readonly neptuneEndpoint: string;
    readonly neptunePort: string;
}

export class ApiConstruct extends Construct {
    stack: Stack;
    userPoolId: string;
    userPoolClientId: string;
    apiGatewayUrl: string;
    constructor(scope: Construct, id: string, props: ApiConstructProps) {
        super(scope, id);
        this.stack = Stack.of(scope);
        const neptuneIntegratorPolicy = new Policy(this, "NeptuneIntegratorPolicy", {
            statements: [
                new PolicyStatement({
                    sid: "NeptuneDbAccess",
                    actions: [
                        "neptune-db:connect",
                        "neptune-db:ReadDataViaQuery",
                        "neptune-db:WriteDataViaQuery",
                        "neptune-db:DeleteDataViaQuery",
                        "neptune-db:GetQueryStatus",
                        "neptune-db:CancelQuery"
                    ],
                    effect: Effect.ALLOW,
                    resources: [`${props.neptuneClusterArn}/*`]
                })
            ]
        });
        const apiAccessLogGroup = new LogGroup(this, "ApiGatewayAccessLogs", {
            retention: RetentionDays.TWO_YEARS
        });

        apiAccessLogGroup.grantWrite(new ServicePrincipal("apigateway.amazonaws.com"));
        const cognitoToApiGatewayToLambdaConstruct = new CognitoToApiGatewayToLambda(this, "CognitoApiGateway", {
            lambdaFunctionProps: {
                runtime: Runtime.NODEJS_18_X,
                handler: "index.lambdaHandler",
                vpc: props.vpc,
                code: Code.fromBucket(props.sourceCodeBucket, `${props.sourceCodePrefix}/neptune-integrator.zip`),
                description: "SupplyChainSimulatorOnAWS neptune integrator",
                environment: {
                    NEPTUNE_ENDPOINT: `${props.neptuneEndpoint}`,
                    NEPTUNE_PORT: `${props.neptunePort}`,
                    [API_METRICS_SOLUTION_ID_ENV_KEY]: `${props.apiMetricsKey}`,
                    ALLOW_ORIGIN: `https://${props.distributionDomainName}`
                },
                securityGroups: [props.ingressSecurityGroup],
                allowPublicSubnet: false,
                timeout: Duration.seconds(600)
            },
            apiGatewayProps: {
                proxy: false,
                defaultCorsPreflightOptions: {
                    allowHeaders: ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "x-amz-user-agent"],
                    allowMethods: ["GET", "POST", "PUT", "DELETE"],
                    allowOrigins: [`https://${props.distributionDomainName}`]
                },
                // For more info on API GW https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-logging.html
                deployOptions: {
                    accessLogDestination: new LogGroupLogDestination(apiAccessLogGroup),
                    accessLogFormat: AccessLogFormat.custom(
                        // eslint-disable-next-line
                        `${AccessLogFormat.clf()} ${AccessLogField.contextExtendedRequestId()} ${AccessLogField.contextAuthorizerClaims(
                            "sub"
                        )}`
                    )
                }
            },
            cognitoUserPoolProps: {
                userInvitation: {
                    emailSubject: "Welcome to Supply Chain Simulator On AWS",
                    emailBody:
                        "You are invited to join SupplyChainSimulatorOnAWS. Username: {username}   Password: {####}.",
                    smsMessage: "Your username is {username} and temporary password is {####}."
                },
                signInAliases: { username: true, email: true },
                autoVerify: { email: true },
                userVerification: {
                    emailSubject: "Your Supply Chain Simulator On AWS console verification code",
                    emailBody: "Your Supply Chain Simulator On AWS console verification code is {####}.",
                    smsMessage: "Your Supply Chain Simulator On AWS console verification code is {####}."
                },
                accountRecovery: AccountRecovery.EMAIL_ONLY,
                standardAttributes: { email: { required: true, mutable: false } },
                passwordPolicy: {
                    minLength: 8,
                    requireUppercase: true,
                    requireDigits: true,
                    requireSymbols: true
                }
            },
            cognitoUserPoolClientProps: {
                authFlows: {
                    userSrp: true,
                    adminUserPassword: true,
                    custom: true
                }
            }
        });

        const emailSplit = Fn.split("@", props.email);
        const username = Fn.select(0, emailSplit);

        // eslint-disable-next-line no-new, prettier/prettier
        const adminUser = new CfnUserPoolUser(this, "AdminUser", { // NOSONAR: typescript:S1848 typescript:S1848
            userPoolId: cognitoToApiGatewayToLambdaConstruct.userPool.userPoolId,
            forceAliasCreation: false,
            username: username,
            desiredDeliveryMediums: ["EMAIL"],
            userAttributes: [
                {
                    name: "email",
                    value: props.email
                }
            ]
        });

        cognitoToApiGatewayToLambdaConstruct.apiGateway.addGatewayResponse("5xxResponse", {
            type: ResponseType.DEFAULT_5XX,
            statusCode: "500",
            responseHeaders: {
                "Access-Control-Allow-Origin": `'https://${props.distributionDomainName}'`
            }
        });
        cognitoToApiGatewayToLambdaConstruct.apiGateway.addGatewayResponse("4xxResponse", {
            type: ResponseType.DEFAULT_4XX,
            statusCode: "400",
            responseHeaders: {
                "Access-Control-Allow-Origin": `'https://${props.distributionDomainName}'`
            }
        });

        const bodyAndRequestValidator = cognitoToApiGatewayToLambdaConstruct.apiGateway.addRequestValidator(
            "ValidateBodyAndParameters",
            {
                validateRequestBody: true,
                validateRequestParameters: true
            }
        );
        const bodyValidator = cognitoToApiGatewayToLambdaConstruct.apiGateway.addRequestValidator("ValidateBody", {
            validateRequestBody: true,
            validateRequestParameters: false
        });
        const requestParametersValidator = cognitoToApiGatewayToLambdaConstruct.apiGateway.addRequestValidator(
            "ValidateRequestParameters",
            {
                validateRequestBody: false,
                validateRequestParameters: true
            }
        );

        this.userPoolId = cognitoToApiGatewayToLambdaConstruct.userPool.userPoolId;
        this.userPoolClientId = cognitoToApiGatewayToLambdaConstruct.userPoolClient.userPoolClientId;
        this.apiGatewayUrl = cognitoToApiGatewayToLambdaConstruct.apiGateway.url;

        cognitoToApiGatewayToLambdaConstruct.userPool.applyRemovalPolicy(RemovalPolicy.DESTROY);

        cognitoToApiGatewayToLambdaConstruct.lambdaFunction.role?.attachInlinePolicy(neptuneIntegratorPolicy);

        const lambdaIntegration = new LambdaIntegration(cognitoToApiGatewayToLambdaConstruct.lambdaFunction, {
            proxy: true
        });

        const apiValidationModelFactory = new ApiValidationModelFactory(
            this,
            cognitoToApiGatewayToLambdaConstruct.apiGateway
        );

        // Custom Field
        const customFieldResource = cognitoToApiGatewayToLambdaConstruct.apiGateway.root.addResource("custom-field");
        const labelCustomFieldResource = customFieldResource.addResource("{label}", {
            defaultMethodOptions: {
                requestParameters: {
                    [GetRequestParameterKeyBy(ValidationParameterEnum.path, "label")]: true
                }
            }
        });
        labelCustomFieldResource.addMethod("GET", lambdaIntegration, {
            requestValidator: requestParametersValidator
        });
        labelCustomFieldResource.addMethod(
            "POST",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyAndRequestValidator,
                apiValidationModelFactory.GetCustomFieldValidationModel()
            )
        );

        // Location
        const locationResource = cognitoToApiGatewayToLambdaConstruct.apiGateway.root.addResource("location");
        locationResource.addMethod("GET", lambdaIntegration);
        locationResource.addMethod(
            "POST",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetLocationPostValidationModel()
            )
        );
        locationResource.addMethod(
            "PUT",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetLocationPutDeleteValidationModel()
            )
        );
        locationResource.addMethod(
            "DELETE",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetLocationPutDeleteValidationModel()
            )
        );
        const singleLocationResource = locationResource.addResource("{location}");
        singleLocationResource.addMethod("GET");
        const locationTypeResource = locationResource.addResource("type").addResource("{type}");
        locationTypeResource.addMethod("GET");

        const locationTransferResource = locationResource.addResource("transfer", {
            defaultMethodOptions: {
                requestValidator: requestParametersValidator,
                requestParameters: {
                    [GetRequestParameterKeyBy(ValidationParameterEnum.path, "location")]: true
                }
            }
        });
        locationTransferResource.addMethod(
            "POST",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetLocationTransferPutPostValidationModel()
            )
        );
        locationTransferResource.addMethod(
            "DELETE",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetLocationTransferDeleteValidationModel()
            )
        );
        locationTransferResource.addMethod(
            "PUT",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetLocationTransferPutPostValidationModel()
            )
        );
        const locationTransferDownstreamResource = locationTransferResource
            .addResource("downstream")
            .addResource("{location}");
        locationTransferDownstreamResource.addMethod("GET");
        const locationTransferUpstreamResource = locationTransferResource
            .addResource("upstream")
            .addResource("{location}");
        locationTransferUpstreamResource.addMethod("GET");

        // Item
        const itemResource = cognitoToApiGatewayToLambdaConstruct.apiGateway.root.addResource("item");
        itemResource.addMethod("GET", lambdaIntegration);
        itemResource.addMethod(
            "POST",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(bodyValidator, apiValidationModelFactory.GetItemPostValidationModel())
        );
        itemResource.addMethod(
            "PUT",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetItemPutDeleteValidationModel()
            )
        );
        itemResource.addMethod(
            "DELETE",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetItemPutDeleteValidationModel()
            )
        );
        const singleItemResource = itemResource.addResource("{item}");
        singleItemResource.addMethod("GET");
        const locationItemResource = itemResource.addResource("location").addResource("{location}");
        locationItemResource.addMethod("GET");

        //Item Record
        const itemRecordResource = cognitoToApiGatewayToLambdaConstruct.apiGateway.root.addResource("item-record");
        itemRecordResource.addMethod("GET", lambdaIntegration);
        itemRecordResource.addMethod(
            "DELETE",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(bodyValidator, apiValidationModelFactory.GetItemRecordValidationModel())
        );
        const singleItemRecordResource = itemRecordResource.addResource("{itemrecord}");
        singleItemRecordResource.addMethod("GET", lambdaIntegration, {
            requestValidator: requestParametersValidator,
            requestParameters: {
                [GetRequestParameterKeyBy(ValidationParameterEnum.path, "itemrecord")]: true
            }
        });
        const itemRecordByItemResource = itemRecordResource.addResource("item").addResource("{itemId}", {
            defaultMethodOptions: {
                requestValidator: requestParametersValidator,
                requestParameters: {
                    [GetRequestParameterKeyBy(ValidationParameterEnum.path, "itemId")]: true
                }
            }
        });
        itemRecordByItemResource.addMethod("GET");

        //Inventory Plan
        const inventoryPlanResource =
            cognitoToApiGatewayToLambdaConstruct.apiGateway.root.addResource("inventory-plan");
        inventoryPlanResource.addMethod("GET", lambdaIntegration);
        inventoryPlanResource.addMethod(
            "POST",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetInventoryPlanPostValidationModel()
            )
        );
        inventoryPlanResource.addMethod(
            "PUT",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetInventoryPlanPutDeleteValidationModel()
            )
        );
        inventoryPlanResource.addMethod("DELETE", lambdaIntegration);
        const singleInventoryPlanResource = inventoryPlanResource.addResource("{inventoryplan}");
        singleInventoryPlanResource.addMethod("GET");
        const locationInventoryPlanResource = inventoryPlanResource.addResource("location").addResource("{location}");
        locationInventoryPlanResource.addMethod("GET");

        //Transfer Plan
        const transferPlanResource = cognitoToApiGatewayToLambdaConstruct.apiGateway.root.addResource("transfer-plan");
        transferPlanResource.addMethod("GET", lambdaIntegration);
        transferPlanResource.addMethod(
            "POST",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetTransferPlanPostValidationModel()
            )
        );
        transferPlanResource.addMethod(
            "PUT",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetTransferPlanPutValidationModel()
            )
        );
        transferPlanResource.addMethod(
            "DELETE",
            lambdaIntegration,
            GetMethodOptionsForBodyValidationBy(
                bodyValidator,
                apiValidationModelFactory.GetTransferPlanDeleteValidationModel()
            )
        );
        const locationTransferPlanResource = transferPlanResource.addResource("{location}");
        locationTransferPlanResource.addMethod("GET");
        const locationTakesTransferPlanResource = transferPlanResource.addResource("takes").addResource("{location}");
        locationTakesTransferPlanResource.addMethod("GET");
        const locationGivesTransferPlanResource = transferPlanResource.addResource("gives").addResource("{location}");
        locationGivesTransferPlanResource.addMethod("GET");

        //Projection
        const projectionResource = cognitoToApiGatewayToLambdaConstruct.apiGateway.root.addResource("projection");
        const itemProjectionResource = projectionResource.addResource("{item}");
        itemProjectionResource.addMethod("GET");

        const futureDateResource = projectionResource.addResource("future-date").addResource("{item}");
        futureDateResource.addMethod("GET");

        //Exception
        const exceptionResource = cognitoToApiGatewayToLambdaConstruct.apiGateway.root.addResource("exception");
        exceptionResource.addMethod("GET", lambdaIntegration);
        const itemExceptionResource = exceptionResource.addResource("item").addResource("{item}");
        itemExceptionResource.addMethod("GET");
        const locationExceptionResource = exceptionResource.addResource("location").addResource("{location}");
        locationExceptionResource.addMethod("GET");

        //Graph
        const graphResource = cognitoToApiGatewayToLambdaConstruct.apiGateway.root.addResource("graph");
        graphResource.addMethod("GET", lambdaIntegration);

        this.addOptionsNagSuppression(cognitoToApiGatewayToLambdaConstruct.apiGateway.root);
        this.removeNestedInvokePermissions(cognitoToApiGatewayToLambdaConstruct.apiGateway.root);

        cognitoToApiGatewayToLambdaConstruct.lambdaFunction.addPermission(id + "ApiGWPermissions", {
            action: "lambda:InvokeFunction",
            principal: new ServicePrincipal("apigateway.amazonaws.com"),
            sourceArn: cognitoToApiGatewayToLambdaConstruct.apiGateway.arnForExecuteApi()
        });

        // Mandatory to call this method to Apply the Cognito Authorizers on all API methods
        cognitoToApiGatewayToLambdaConstruct.addAuthorizers();

        this.addNagSuppression(this.stack);
    }

    addOptionsNagSuppression(resource: IResource) {
        NagSuppressions.addResourceSuppressionsByPath(
            this.stack,
            `${resource.node.path}/OPTIONS/Resource`,
            [
                {
                    id: "AwsSolutions-APIG4",
                    reason: "The OPTIONS method cannot use auth as the server has to respond to the OPTIONS request for cors reasons"
                },
                {
                    id: "AwsSolutions-COG4",
                    reason: "The OPTIONS method cannot use auth as the server has to respond to the OPTIONS request for cors reasons"
                }
            ],
            true
        );
        resource.node.children.forEach((child: unknown) => {
            if (child instanceof Resource) {
                this.addOptionsNagSuppression(child);
            }
        });
    }

    removeNestedInvokePermissions(resource: IResource) {
        resource.node.children.forEach((child: unknown) => {
            if (child instanceof Resource) {
                this.removeNestedInvokePermissions(child);
            } else if (child instanceof Method) {
                const permissions = child.node.children.filter((c: unknown) => c instanceof CfnPermission);
                permissions.forEach((p: unknown) => child.node.tryRemoveChild((p as CfnPermission).node.id));
            }
        });
    }

    addNagSuppression(resource: Stack) {
        NagSuppressions.addResourceSuppressions(
            resource,
            [
                {
                    id: "AwsSolutions-IAM5",
                    reason: "Lambda IAM roles require wildcard permissions for logging and Xray tracing."
                },
                {
                    id: "AwsSolutions-IAM4",
                    reason: "Default Lambda AWS managed policies, all permissions are required."
                },
                {
                    id: "AwsSolutions-APIG3",
                    reason: "The REST API does not require enabling WAF."
                },
                {
                    id: "AwsSolutions-COG2",
                    reason: "MFA is subjected to customer usecase."
                }
            ],
            true
        );
    }
}
