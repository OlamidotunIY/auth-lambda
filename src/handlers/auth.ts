import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { userService } from "../services/user.service";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

function json(status: number, body: unknown): APIGatewayProxyResult {
  return { statusCode: status, body: JSON.stringify(body) };
}

function safeLog(
  level: "info" | "warn" | "error",
  message: string,
  details?: any,
  error?: unknown
) {
  const log: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    message,
    ...details,
  };

  if (error instanceof Error) {
    log.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  const str = JSON.stringify(log);

  if (level === "error") console.error(str);
  else if (level === "warn") console.warn(str);
  else console.log(str);
}

// ✅ Unified error formatter for Zod
function formatZodErrors(err: z.ZodError) {
  return err.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
}

// ✅ Lambda handler
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const path = event.path || "/";
  const method = (event.httpMethod || "POST").toUpperCase();

  let body: any = {};
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return json(400, { errors: [{ message: "Invalid JSON" }] });
  }

  try {
    if (path === "/register" && method === "POST") {
      const parsed = registerSchema.parse(body);
      safeLog("info", "register_attempt", { email: parsed.email });

      const res = await userService.register(
        parsed.email,
        parsed.password,
        parsed.name ?? null
      );

      safeLog("info", "register_success", {
        email: parsed.email,
        userId: res.userId,
      });
      return json(201, { success: true, ...res });
    }

    if (path === "/login" && method === "POST") {
      const parsed = loginSchema.parse(body);
      safeLog("info", "login_attempt", { email: parsed.email });

      const res = await userService.login(parsed.email, parsed.password);

      safeLog("info", "login_success", { email: parsed.email });
      return json(200, res);
    }

    return json(404, { errors: [{ message: "Not found" }] });
  } catch (err: any) {
    safeLog("error", "operation_failed", { path }, err);

    if (err.message?.includes("user already exists"))
      return json(409, { errors: [{ message: "User already exists" }] });
    if (err.message?.includes("locked"))
      return json(403, { errors: [{ message: err.message }] });
    if (err.message?.includes("invalid credentials"))
      return json(401, { errors: [{ message: "Invalid credentials" }] });
    if (err instanceof z.ZodError)
      return json(400, { errors: formatZodErrors(err) });

    return json(500, { errors: [{ message: "Internal server error" }] });
  }
};
