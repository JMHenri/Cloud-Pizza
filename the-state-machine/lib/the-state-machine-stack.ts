import * as cdk from '@aws-cdk/core';
import lambda = require('@aws-cdk/aws-lambda');
import apigw = require('@aws-cdk/aws-apigatewayv2');
import sfn = require('@aws-cdk/aws-stepfunctions');
import tasks = require('@aws-cdk/aws-stepfunctions-tasks');
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import * as stepfunctions from '@aws-cdk/aws-stepfunctions';



//object reference.
declare enum addressType {
  email,
  endpoint
}
declare enum pizzaSizes {
  small,
  medium,
  large
}
export type pizzaDelivery = {
  addressType: addressType,
  pizzaDetails: {
      size: pizzaSizes,
      price: number
  }
}


export class TheStateMachineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /**
     * Step Function Starts Here
     */


     const catchProps: stepfunctions.CatchProps = {
      errors: ['Something went wrong'],
    };
    //errorHandle
    let notifySupportLambda = new lambda.Function(this, 'notifySupportHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns'),
      handler: 'notifySupport.handler'
    });
    const notifySupport = new tasks.LambdaInvoke(this, "notifySupport", {
      lambdaFunction: notifySupportLambda,
      inputPath: '$',
      resultPath: '$',
      payloadResponseOnly: true,
    })

    



    //check store hours
    let checkStoreHoursLambda = new lambda.Function(this, 'checkStoreHoursHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns'),
      handler: 'checkStoreHours.handler'
    });
    const checkStoreHours = new tasks.LambdaInvoke(this, "Check Store Hours", {
      lambdaFunction: checkStoreHoursLambda,
      inputPath: '$',
      resultPath: '$.storeIsOpen',
      payloadResponseOnly: true
    })

    //Lambda - check delivery type
    let checkDeliveryTypeLambda = new lambda.Function(this, 'checkDeliveryTypeHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns'),
      handler: 'checkDeliveryType.handler'
    });
    //task - check delivery type
    const checkDeliveryType = new tasks.LambdaInvoke(this, "Check Delivery Type", {
      lambdaFunction: checkDeliveryTypeLambda,
      inputPath: '$.customerInfo',
      resultPath: '$.canDeliver',
      payloadResponseOnly: true
    })

    /**
     * delivery options
     */
     let emailPizzaLambda = new lambda.Function(this, 'emailPizzaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns/delivery-opts'),
      handler: 'emailPizza.handler'
    });
    //Step - check store hours
    const emailPizza = new tasks.LambdaInvoke(this, "Email Pizza Delivery", {
      lambdaFunction: emailPizzaLambda,
      inputPath: '$',
      resultPath: '$.emailResult',
      payloadResponseOnly: true
    }).addCatch(notifySupport, catchProps);

    let webPostPizzaLambda = new lambda.Function(this, 'webPostPizzaHandler', {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset('lambda-fns/delivery-opts'),
      handler: 'webPostPizza.handler'
    });
    //Step - check store hours
    const webPostPizza = new tasks.LambdaInvoke(this, "Web Post Pizza Delivery", {
      lambdaFunction: webPostPizzaLambda,
      inputPath: '$',
      resultPath: '$.webPostResult',
      payloadResponseOnly: true,
    }).addCatch(notifySupport, catchProps);


    /**
     * failures
     */
    const storeClosed = new sfn.Fail(this, 'Can only deliver on odd numbered epoch times', {
      cause: 'The store was closed',
      error: 'Pizza order canceled: Store closed',
    });
    const cannotDeliver = new sfn.Fail(this, 'Cloud pizzas can only be delivered over the internet.', {
      cause: 'The customer tried to order a real pizza',
      error: 'Pizza order canceled: Cloud pizza only',
    });


    //Express Step function definition
    const checkDeliveryChain = sfn.Chain
    .start(checkDeliveryType)
    .next(new sfn.Choice(this, 'Invoke Delivery')
        .when(sfn.Condition.stringEquals('$.customerInfo.addressType', 'email'), emailPizza)
        .when(sfn.Condition.stringEquals('$.customerInfo.addressType', 'endpoint'), webPostPizza)
        .when(sfn.Condition.stringEquals('$.customerInfo.addressType', 'physical'), cannotDeliver));


    const definition = sfn.Chain
    .start(checkStoreHours)
    .next(new sfn.Choice(this, 'Store is open?')
        .when(sfn.Condition.booleanEquals('$.storesAreOpen', false), storeClosed)
        .otherwise(checkDeliveryChain))




    let stateMachine = new sfn.StateMachine(this, 'StateMachine', {
      definition,
      timeout: cdk.Duration.minutes(5),
      tracingEnabled: true,
      stateMachineType: sfn.StateMachineType.EXPRESS
    });

    /**
     * HTTP API Definition
     */
    // defines an API Gateway HTTP API resource backed by our step function


    // We need to give our HTTP API permission to invoke our step function
    const httpApiRole = new Role(this, 'HttpApiRole', {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: {
        AllowSFNExec: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['states:StartSyncExecution'],
              effect: Effect.ALLOW,
              resources: [stateMachine.stateMachineArn]
            })
          ]
        })
      }
    })

    const api = new apigw.HttpApi(this, 'the-state-machine-api', {
      createDefaultStage: true,
    });

    // create an AWS_PROXY integration between the HTTP API and our Step Function
    const integ = new apigw.CfnIntegration(this, 'Integ', {
      apiId: api.httpApiId,
      integrationType: 'AWS_PROXY',
      connectionType: 'INTERNET',
      integrationSubtype: 'StepFunctions-StartSyncExecution',
      credentialsArn: httpApiRole.roleArn,
      requestParameters: {
        Input: "$request.body",
        StateMachineArn: stateMachine.stateMachineArn
      },
      payloadFormatVersion: '1.0',
      timeoutInMillis: 10000,
    });

    new apigw.CfnRoute(this, 'DefaultRoute', {
      apiId: api.httpApiId,
      routeKey: apigw.HttpRouteKey.DEFAULT.key,
      target: `integrations/${integ.ref}`,
    });

    // output the URL of the HTTP API
    new cdk.CfnOutput(this, 'HTTP API Url', {
      value: api.url ?? 'Something went wrong with the deploy'
    });
  }
}
