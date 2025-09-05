#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AuthLambdaStack } from "../lib/auth-lambda-stack";

const app = new cdk.App();
new AuthLambdaStack(app, "AuthLambdaStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
