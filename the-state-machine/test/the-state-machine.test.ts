import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import TheStateMachine = require('../lib/the-state-machine-stack');

test('API Gateway Proxy Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new TheStateMachine.TheStateMachineStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(haveResourceLike("AWS::ApiGatewayV2::Integration", {
    "IntegrationType": "AWS_PROXY",
    "ConnectionType": "INTERNET",
    "IntegrationSubtype": "StepFunctions-StartSyncExecution",
    "PayloadFormatVersion": "1.0",
    "RequestParameters": {
        "Input": "$request.body",
        "StateMachineArn": {
        }
    },
    "TimeoutInMillis": 10000
  }
  ));
});


test('Web Post Lambda Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new TheStateMachine.TheStateMachineStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
    "Handler": "webPostPizza.handler"
  }
  ));
});
test('Check Delivery Type Lambda Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new TheStateMachine.TheStateMachineStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
    "Handler": "checkDeliveryType.handler"
  }
  ));
});

