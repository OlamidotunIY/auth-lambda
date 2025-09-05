# Auth Lambda Service (AWS CDK + TypeScript)

This project implements a **serverless authentication service** using:

- **AWS Lambda** (business logic)
- **API Gateway** (REST API)
- **DynamoDB** (user storage)
- **Secrets Manager** (JWT secret)
- **CloudWatch + SNS** (monitoring and alerts)
- **AWS CDK** (infrastructure as code, TypeScript)

The service provides **user registration** and **login** endpoints with JWT authentication.

---

## 📂 Project Structure

.
├── bin/ # CDK app entrypoint
│ └── auth-lambda.ts
├── lib/ # CDK stack (infra definitions)
│ └── auth-lambda-stack.ts
├── src/
│ ├── handlers/ # Lambda entrypoints
│ │ └── auth.ts
│ ├── schemas/ # Zod validation schemas
│ │ └── auth.schema.ts
│ ├── services/ # Business logic
│ │ ├── db.service.ts
│ │ ├── token.service.ts
│ │ └── user.service.ts
│ └── types/ # Type definitions
│ └── user.ts
├── test/ # (Optional) unit/integration tests
├── package.json
├── tsconfig.json
├── jest.config.js
├── cdk.json
└── README.md

yaml
Copy code

---

## ⚡ Features

- User Registration (`POST /register`)
- User Login (`POST /login`)
- Password hashing with **bcrypt**
- JWT generation with secret stored in **AWS Secrets Manager**
- **DynamoDB** for user persistence
- **CloudWatch Alarm** for excessive failed logins (optional email notifications)
- Secure, scalable, cost-optimized design

---

## 🚀 Setup & Deployment

1. **Install dependencies**
   ```bash
   npm install
   ```

## 🚀 Setup & Deployment

1. **Bootstrap your AWS environment**

   ```bash
   npx cdk bootstrap
   ``

   ```

2. **Deploy the stack**

   ```bash
   npx cdk deploy
   ```

The output will include an API Gateway endpoint.

---

## 📡 Usage

### Register a user

```bash
curl -X POST https://<api-id>.execute-api.<region>.amazonaws.com/prod/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "StrongPassword123",
    "name": "John Doe"
  }'
```

### Login a user

```bash
curl -X POST https://<api-id>.execute-api.<region>.amazonaws.com/prod/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "StrongPassword123"
  }'
```

#### Response

```json
{
  "token": "eyJhbGciOiJI..."
}
```

---

## 🛡 Improvements

(See [IMPROVEMENTS.md](./IMPROVEMENTS.md) for details)

- Add password reset flows
- Use AWS Cognito for managed auth
- Add rate limiting / WAF
- Enable structured logging with `console.error` for errors
- Optimize Lambda cold starts with smaller bundles

---

## 🧪 Testing

Run unit tests:

```bash
npm run test
```

---

## 📖 Notes

- Ensure you set up AWS credentials with `aws configure`.
- The stack automatically provisions all resources (Lambda, API Gateway, DynamoDB, Secrets Manager).
- Default removal policy is `DESTROY` (good for dev, update to `RETAIN` in production).

``

👉 The **key difference** is:

- ✅ **Markdown fenced code blocks** (` ```bash` instead of "bash / Copy code")
- ✅ **Headings (`##`)** instead of plain bold text
- ✅ **Lists and links render cleanly**

If you put the above in a file called `README.md`, GitHub will render it perfectly.

Do you want me to clean up **your full README draft** (the one with project structure + setup + usage) so it’s 100% copy-paste ready for GitHub?

```