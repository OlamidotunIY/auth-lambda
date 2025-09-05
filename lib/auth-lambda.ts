import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime, Tracing } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as sns from "aws-cdk-lib/aws-sns";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";

export interface AuthLambdaProps {
  alarmEmail?: string;
}

export class AuthLambda extends Construct {
  constructor(scope: Construct, id: string, props: AuthLambdaProps = {}) {
    super(scope, id);

    // DynamoDB table for users
    const usersTable = new dynamodb.Table(this, "UsersTable", {
      partitionKey: { name: "email", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY, // dev only, keep for now
    });

    // Secrets Manager for JWT secret
    const jwtSecret = new secretsmanager.Secret(this, "JwtSecret", {
      secretName: "AuthLambdaJwtSecret",
      generateSecretString: {
        secretStringTemplate: JSON.stringify({}),
        generateStringKey: "jwtSecret",
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // Lambda function
    const authFunction = new NodejsFunction(this, "AuthFunction", {
      runtime: Runtime.NODEJS_18_X,
      entry: path.join(__dirname, "../src/handlers/auth.ts"),
      handler: "handler",
      environment: {
        USERS_TABLE: usersTable.tableName,
        JWT_SECRET_NAME: jwtSecret.secretName,
      },
      timeout: Duration.seconds(30), // ✅ increase from 3s → 30s
      memorySize: 256, // ✅ give it more room
      tracing: Tracing.ACTIVE, // ✅ enable X-Ray
      logRetention: logs.RetentionDays.ONE_WEEK, // keep logs
    });

    // Grant access
    usersTable.grantReadWriteData(authFunction);
    jwtSecret.grantRead(authFunction);

    // API Gateway
    const api = new LambdaRestApi(this, "AuthApi", {
      handler: authFunction,
      proxy: false,
    });

    // /register POST
    const registerResource = api.root.addResource("register");
    registerResource.addMethod("POST", new LambdaIntegration(authFunction));

    // /login POST
    const loginResource = api.root.addResource("login");
    loginResource.addMethod("POST", new LambdaIntegration(authFunction));

    // Optional alerting
    if (props.alarmEmail) {
      const alarmTopic = new sns.Topic(this, "AuthLambdaAlarmTopic", {
        displayName: "Auth Lambda Alarms",
      });
      alarmTopic.addSubscription(new subs.EmailSubscription(props.alarmEmail));

      const metricFilter = new logs.MetricFilter(
        this,
        "LoginFailedMetricFilter",
        {
          logGroup: authFunction.logGroup,
          metricNamespace: "AuthService",
          metricName: "LoginFailedCount",
          filterPattern: logs.FilterPattern.literal("login_failed"),
          metricValue: "1",
        }
      );

      const loginFailureMetric = metricFilter.metric({
        period: Duration.minutes(1),
        statistic: "sum",
      });

      new cloudwatch.Alarm(this, "LoginFailedAlarm", {
        metric: loginFailureMetric,
        threshold: 5,
        evaluationPeriods: 1,
        alarmDescription:
          "Triggers if too many login failures happen in 1 minute",
        alarmName: "AuthService-LoginFailures",
      }).addAlarmAction({
        bind: () => ({ alarmActionArn: alarmTopic.topicArn }),
      });
    }
  }
}
