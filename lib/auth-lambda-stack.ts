import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthLambda } from './auth-lambda';

export class AuthLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new AuthLambda(this, 'AuthLambda', {
      alarmEmail: 'olamidotun225@gmail.com', // optional
    });
  }
}

