import AWS from "aws-sdk";
import { UserItem } from "../types/user";

const dynamo = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE!;
if (!USERS_TABLE) throw new Error("USERS_TABLE env var required");

export const db = {
  async getUserByEmail(email: string): Promise<UserItem | undefined> {
    const res = await dynamo
      .get({ TableName: USERS_TABLE, Key: { email } })
      .promise();
    return res.Item as UserItem | undefined;
  },

  async putUser(user: UserItem) {
    await dynamo
      .put({
        TableName: USERS_TABLE,
        Item: user,
        ConditionExpression: "attribute_not_exists(email)", // avoid overwrite
      })
      .promise();
  },

  async updateLoginAttempts(
    email: string,
    attempts: number,
    lockedUntil: string | null
  ) {
    const update: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
      TableName: USERS_TABLE,
      Key: { email },
      UpdateExpression:
        "SET loginAttempts = :la, lockedUntil = :locked, updatedAt = :u",
      ExpressionAttributeValues: {
        ":la": attempts,
        ":locked": lockedUntil,
        ":u": new Date().toISOString(),
      },
    };
    await dynamo.update(update).promise();
  },

  async resetLoginAttempts(email: string) {
    await dynamo
      .update({
        TableName: USERS_TABLE,
        Key: { email },
        UpdateExpression:
          "SET loginAttempts = :zero, lockedUntil = :null, updatedAt = :u",
        ExpressionAttributeValues: {
          ":zero": 0,
          ":null": null,
          ":u": new Date().toISOString(),
        },
      })
      .promise();
  },
};
