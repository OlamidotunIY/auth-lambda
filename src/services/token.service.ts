import AWS from "aws-sdk";
import jwt from "jsonwebtoken";

const secrets = new AWS.SecretsManager();
const SECRET_NAME = process.env.JWT_SECRET_NAME!;
if (!SECRET_NAME) throw new Error("JWT_SECRET_NAME env var required");

let cachedSecret: string | undefined;

async function fetchSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  const res = await secrets.getSecretValue({ SecretId: SECRET_NAME }).promise();
  if (!res.SecretString)
    throw new Error("Missing secret string in Secrets Manager for JWT");
  try {
    const parsed = JSON.parse(res.SecretString);
    if (!parsed.jwtSecret || typeof parsed.jwtSecret !== "string")
      throw new Error("jwtSecret key missing in secret JSON");
    cachedSecret = parsed.jwtSecret;
    return cachedSecret!;
  } catch (e) {
    if (res.SecretString) {
      cachedSecret = res.SecretString;
      return cachedSecret;
    }
    throw e;
  }
}

export const tokenService = {
  async sign(payload: object, opts?: jwt.SignOptions): Promise<string> {
    const secret = await fetchSecret();
    return jwt.sign(payload, secret, { ...(opts || { expiresIn: "15m" }) });
  },
  async verify(token: string): Promise<any> {
    const secret = await fetchSecret();
    return jwt.verify(token, secret);
  },

  clearCache() {
    cachedSecret = undefined;
  },
};
