# 🔧 Improvements for Auth Lambda Service (by Dotun)

This document highlights potential improvements to the **Auth Lambda Service** I built using AWS CDK, Lambda, API Gateway, DynamoDB, and Secrets Manager.

It focuses on **security, performance, monitoring, cost optimization, and developer experience**.

---

## 🔒 Security Improvements
- [ ] **Migrate to AWS Cognito for production**: while custom JWT auth works, Cognito offers managed auth with MFA, social logins, and built-in scalability.
- [ ] **Automatic JWT Secret Rotation**: currently, JWT secrets are stored in Secrets Manager but not rotated. Enabling rotation would reduce long-term risk.
- [ ] **IAM Least Privilege**: Lambda roles could be further restricted to only allow specific DynamoDB actions (`GetItem`, `PutItem`) rather than full read/write.
- [ ] **Add rate limiting / AWS WAF**: protect login endpoints from brute-force attacks.
- [ ] **Data Encryption**: DynamoDB has encryption at rest by default, but I can also add client-side encryption for sensitive fields like passwords if required.

✅ Already implemented:
- Password hashing with bcrypt.
- JWT secret stored in AWS Secrets Manager.

---

## ⚡ Performance Enhancements
- [ ] **Optimize Lambda cold starts**:
  - Use AWS Lambda Layers for heavy dependencies like `bcrypt`.
  - Reduce bundle size (currently ~23MB) with tree-shaking.
- [ ] **Add caching**:
  - DynamoDB Accelerator (DAX) or in-memory caching for frequently accessed users.
- [ ] **Pagination for queries**: right now only simple get/put are used, but for listing users (future feature) I’ll implement proper pagination.

✅ Already implemented:
- DynamoDB `PAY_PER_REQUEST` mode (auto-scales with traffic).

---

## 📊 Monitoring & Observability
- [ ] **Enable AWS X-Ray** for tracing across Lambda + API Gateway.
- [ ] **Improve structured logging**: right now I log JSON, but errors should always go through `console.error` for visibility in CloudWatch.
- [ ] **Correlation IDs**: include a request ID in all logs to trace individual requests.
- [ ] **CloudWatch Dashboard**: visualize login attempts, failures, and API latency.

✅ Already implemented:
- CloudWatch Alarm + SNS email notification for failed logins.
- MetricFilter for login failures.

---

## 💰 Resource Optimization
- [ ] **Adjust DynamoDB mode for production**:
  - Keep `PAY_PER_REQUEST` for dev/testing.
  - Use **Provisioned + Auto Scaling** in production if traffic becomes predictable.
- [ ] **Review log retention**: currently logs are kept for 30 days. I may shorten this in dev to save cost.
- [ ] **Update removal policies**: `DESTROY` is used for dev, but in production, tables should be set to `RETAIN` to avoid accidental data loss.

✅ Already implemented:
- Cost-efficient defaults for development (on-demand billing, DESTROY policy).

---

## 🧑‍💻 Developer Experience
- [ ] **Add integration tests** for `/register` and `/login` endpoints.
- [ ] **OpenAPI/Swagger docs** for API Gateway (helps future frontend developers).
- [ ] **CI/CD pipeline** with GitHub Actions + CDK deploy.
- [ ] **Linting + pre-commit hooks** for code quality.
- [ ] **Type-safe validation**: currently using Zod. Could optionally explore `class-validator` for a NestJS-like DX.

✅ Already implemented:
- Modular project structure (`handlers`, `services`, `schemas`).
- TypeScript with strict typing.

---

## 🚀 Future Extensions
- [ ] **Password reset flow** with email verification.
- [ ] **Multi-factor authentication (MFA)**.
- [ ] **Account lockout** after repeated failed logins.
- [ ] **User profiles** beyond email/password.
- [ ] **Token revocation / blacklisting** on password reset.
