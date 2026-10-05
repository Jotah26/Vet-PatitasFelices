# Nest, PostgreSQL, and Prisma Backend

## Objective
Replace the frontend-only local persistence model with a secure, modular NestJS backend backed by PostgreSQL and Prisma.

## Problem and why
The current React application stores veterinary, clinical, inventory, and session data in browser `localStorage`. It has no server-side authentication, authorization, transactional consistency, shared data, audit trail, or private file storage.

## Authorized scope
- Create a NestJS API alongside the existing frontend.
- Use PostgreSQL and Prisma for persistence and migrations.
- Add server-side authentication and role-based authorization.
- Migrate the frontend progressively by vertical feature.

## Constraints
- Keep the existing frontend operational during migration.
- Use TypeScript throughout.
- Treat clinical and personal data as private.
- Delivery strategy: ask-on-risk; about 400 authored changed lines is a planning heuristic, not a hard cap.
- TDD mode: enabled by user choice. Runner: Jest. Every behavior task follows RED, GREEN, REFACTOR with observed evidence.

## Tasks
- [x] B01 — Bootstrap the NestJS API, environment configuration, linting, and test runner.
  - Route: delegated; implementation spans multiple non-trivial files.
  - Acceptance: API starts locally, health endpoint responds, and baseline checks run.
  - Checks: selected test runner, lint, build.
- [x] B02 — Model the PostgreSQL/Prisma schema and migrations for users, owners, pets, and roles.
  - Route: delegated; data model and migration are non-trivial coupled files.
  - Acceptance: migrations apply and relational integrity is verified.
  - Checks: Prisma validation, migration test, focused service tests.
- [ ] B03 — Implement secure authentication and server-side role-based authorization.
  - Route: delegated; multiple modules and tests.
  - Acceptance: credentials are hashed; protected endpoints reject unauthenticated or unauthorized requests.
  - Checks: focused auth and authorization tests.
- [ ] B04 — Implement owners, pets, appointments, and appointment requests API verticals.
  - Route: delegated; multiple modules and API tests.
  - Acceptance: validated CRUD and scheduling conflict protection are available through the API.
  - Checks: focused e2e/integration tests.
- [ ] B05 — Implement clinical care, private attachments, inventory, payments, and reminders in bounded verticals.
  - Route: delegated; multiple non-trivial modules; split into coherent work-unit commits.
  - Acceptance: clinical workflows are transactional and sensitive files are private.
  - Checks: focused integration tests per vertical.
- [ ] B06 — Migrate the React data provider from localStorage to authenticated API clients incrementally.
  - Route: delegated; frontend and API integration changes.
  - Acceptance: migrated workflows no longer write business data to localStorage.
  - Checks: frontend build/lint and end-to-end workflow checks.

## Progress and evidence
- Branch: `feature/nest-postgres-prisma-backend` created from `main` and published to `origin`.
- B01 implemented a standalone NestJS application in `backend/`; it does not add Prisma, PostgreSQL, authentication, or business modules.
- B01 work-unit commit: `0026503` (`feat(backend): inicializa API NestJS con salud`).
- TDD evidence for B01:
  - RED: `npm run test:health` failed before implementation with `TS2307: Cannot find module '../src/app.module'` (1 suite failed; 0 tests executed).
  - GREEN: after the health controller and application module were added, the same command passed (1 suite passed; 1 test passed). The initial GREEN run exposed `TypeError: supertest_1.default is not a function`; adding `esModuleInterop` to TypeScript configuration resolved the CommonJS interop configuration issue.
  - REFACTOR: no refactor was warranted; the health endpoint remains a minimal controller.
- Observed baseline checks:
  - Focused health test: `npm run test:health` — passed (1 suite, 1 test).
  - All backend tests: `npm test -- --runInBand` — passed (1 suite, 1 test).
  - Backend lint: `npm run lint` — passed with no output.
  - Backend build: `npm run build` — passed with no output.
  - Runtime: started `node dist/main.js` with `PORT=3100` and `CORS_ORIGINS=http://localhost:5173`; `GET http://127.0.0.1:3100/health` returned `200`, `{"status":"ok"}`, and `Access-Control-Allow-Origin: http://localhost:5173`.
- Rollback boundary: remove `backend/` and this B01 evidence only; no frontend or subsequent backend-task behavior is affected.
- B02 completed the Prisma 7 PostgreSQL foundation through `DATABASE_URL`, including the initial migration for roles, users, owners, and pets.
- B02 schema decisions:
  - The role keys, user statuses, pet species, and pet sexes preserve the frontend domain values.
  - User email, owner document number, owner email, owner user link, and role key are unique.
  - Foreign keys from users to roles, owners to optional users, and pets to owners use `ON DELETE RESTRICT`; future clinical records can therefore add restrictive pet references without changing delete semantics.
  - Timestamps exist on every initial model. No Nest Prisma module/service was added because B02 has no database-backed behavior yet.
- TDD evidence for B02:
  - RED: `npm test -- --runInBand test/environment.validation.e2e-spec.ts` failed because missing `DATABASE_URL` did not throw the expected PostgreSQL connection-string validation error (1 suite failed; 1 test failed).
  - GREEN: after validation and a Jest-only placeholder `DATABASE_URL` were added, the same command passed (1 suite passed; 1 test passed) without connecting to PostgreSQL.
  - REFACTOR: no refactor was warranted; the validation remains a small boundary check.
- Observed B02 checks:
  - Focused Jest test: `npm test -- --runInBand test/environment.validation.e2e-spec.ts` — passed (1 suite, 1 test).
  - All backend tests: `npm test -- --runInBand` — passed (2 suites, 2 tests).
  - Backend lint: `npm run lint` — passed with no output.
  - Backend build: `npm run build` — passed with no output.
  - Prisma validation: with a syntactically valid, non-running PostgreSQL `DATABASE_URL`, `npm run prisma:validate` — passed; schema valid.
  - Migration SQL: `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` generated the initial PostgreSQL migration SQL without connecting to a database.
  - Migration deployment: `npm run prisma:migrate:deploy` — verified against PostgreSQL database `vet_patitas`, schema `public`; 1 migration found and no migrations remained pending. `npx prisma migrate status` reported that the database schema is up to date.
  - Database relational verification: a transaction-scoped `prisma db execute` check passed and rolled back. It confirmed the unique role key, user email, owner document number, owner email, and owner user-link constraints, plus restrictive foreign keys from users to roles, owners to users, and pets to owners.
- B02 rollback boundary: remove `backend/prisma.config.ts`, `backend/prisma/`, the Prisma dependency and scripts, the database environment validation/test setup, and this B02 evidence. B01 health behavior remains independently restorable.
- B02 delivery: one cohesive work-unit commit, including the generated dependency lockfile and task evidence.

## Next step
Implement B03: secure authentication and server-side role-based authorization.
