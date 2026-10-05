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
- [x] B03 — Implement secure authentication and server-side role-based authorization.
  - Route: delegated; multiple modules and tests.
  - Acceptance: credentials are hashed; protected endpoints reject unauthenticated or unauthorized requests.
  - Checks: focused auth and authorization tests.
- [ ] B04 — Implement owners, pets, appointments, and appointment requests API verticals.
  - Route: delegated; multiple modules and API tests.
  - Acceptance: validated CRUD and scheduling conflict protection are available through the API.
  - Checks: focused e2e/integration tests.
  - Delivery strategy: ask-on-risk. Estimated scope exceeds one review slice; each work unit will be independently committed and assessed.
  - [x] B04.1 — Add appointment and appointment-request persistence with transactional scheduling constraints.
    - Route: delegated; schema, migration, and integration verification require coupled database work.
    - Acceptance: non-cancelled veterinarian slots are unique at the PostgreSQL layer and request resolution can link an appointment.
    - Checks: Prisma validation, migration deployment, relational/conflict integration verification.
  - [x] B04.2 — Add authenticated staff CRUD endpoints for owners and pets.
    - Route: delegated; two API verticals with DTOs, services, controllers, authorization, and tests.
    - Acceptance: normalized inputs, ownership integrity, uniqueness conflicts, and restrictive deletion behavior are exposed safely.
    - Checks: focused Jest e2e tests, lint, build.
  - [ ] B04.3 — Add authenticated staff appointment lifecycle endpoints.
    - Route: delegated; authorization, assigned-veterinarian validation, status transitions, and database conflict mapping are coupled.
    - Acceptance: staff can manage appointments without double-booking active slots.
    - Checks: focused Jest e2e tests and PostgreSQL conflict verification.
  - [ ] B04.4 — Add owner-scoped appointment requests and staff resolution lifecycle.
    - Route: delegated; owner authorization, request-to-appointment transaction, and resolution rules span multiple modules.
    - Acceptance: owners can request appointments only for their pets; staff can accept or reject them atomically.
    - Checks: focused Jest e2e tests and transactional integration verification.
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
- B03 bootstrap decision: create the first administrator through an explicit local environment-driven command, not on every application startup and not through manual SQL.
- B03 migration `20261005150000_add_user_password_hash` adds `users.password_hash` as nullable, backfills existing rows with an Argon2id hash of a discarded cryptographically random secret, and then makes the column non-null. Existing users cannot authenticate until their password is explicitly reset.
- B03 authentication uses Argon2id password hashes and 15-minute JWT access tokens. `JWT_SECRET` is required and must have at least 32 characters; no refresh-token flow was added.
- B03 authorization demonstration: `POST /auth/login` issues an access token for valid active credentials; `GET /auth/admin` requires a valid administrator token. Missing and veterinarian credentials are rejected with `401` and `403`, respectively.
- B03 administrator bootstrap is opt-in only: `npm run seed:admin` reads `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` from the local environment, creates an administrator only when none exists, and is not run by application startup.
- TDD evidence for B03:
  - RED: `npm test -- --runInBand test/auth.e2e-spec.ts` failed before the authentication implementation (1 suite failed; 0 tests executed) because `argon2` and `PrismaService` did not yet exist.
  - GREEN: `npm run test:auth` passed after implementation (1 suite passed; 2 tests passed), covering valid credentials and `401`/`403` protected-endpoint enforcement.
  - REFACTOR: corrected the build configuration so generated Prisma code stays within `src` and `nest build` refreshes the executable output; no behavior refactor was warranted.
- Observed B03 checks:
  - Focused authentication tests: `npm run test:auth` — passed (1 suite, 2 tests).
  - All backend tests: `npm test -- --runInBand` — passed (3 suites, 4 tests).
  - Backend lint: `npm run lint` — passed with no output.
  - Backend build: `npm run build` — passed with no output.
  - Prisma validation: `npm run prisma:validate` — passed.
  - Migration deployment and status: `npm run prisma:migrate:deploy` found no pending migrations; `npx prisma migrate status` reported that the database schema is up to date.
  - Safe runtime scenario: with local environment credentials, `POST /auth/login` returned `201` and a token that received `200` from `GET /auth/admin`; no secrets or tokens were printed.
- B03 rollback boundary: remove `backend/src/auth/`, `backend/src/prisma/`, migration `20261005150000_add_user_password_hash`, generated-client configuration and authentication dependencies, then revert the B03 environment, build, test, and task evidence changes. B01 health and the B02 relational schema remain independently restorable after restoring the `users` table definition.
- B03 delivery: one cohesive work-unit commit including the migration, authentication/RBAC behavior, focused tests, dependency lockfile, and this task evidence. The final commit ID is reported in the delivery record.
- B03 migration correction: the backward-compatible path is validated with a legacy user present before the password-hash migration. It preserves the non-null Prisma model while preventing any default usable credential for migrated users.
  - Focused auth test: `npm run test:auth` — passed (1 suite, 2 tests), including rejection of the migration backfill hash with an arbitrary password.
  - Prisma validation: `npm run prisma:validate` — passed.
  - Local PostgreSQL deployment: `npm run prisma:migrate:deploy` and `npx prisma migrate status` — passed; no migrations were pending and the schema was up to date.
  - Local PostgreSQL migration path: a rollback-scoped transaction removed the existing column, inserted a legacy user, applied the nullable-add/backfill/non-null sequence, confirmed the backfill and non-null constraint, then rolled back — passed.
- B04.1 adds `Appointment` and `AppointmentRequest` persistence. Both models retain restrictive foreign keys; appointment requests have an explicit resolution state and an optional one-to-one resolved appointment link.
- B04.1 migration `20261005160000_add_appointments_and_requests` is forward-only. Its partial unique PostgreSQL index permits a veterinarian to have at most one non-cancelled appointment at a scheduled timestamp while allowing a cancelled appointment at that slot.
- TDD evidence for B04.1:
  - RED: `npm test -- --runInBand test/appointment-persistence.e2e-spec.ts` failed before implementation (1 suite failed; 1 test failed) because the schema did not declare `model Appointment`.
  - GREEN: after the Prisma models and migration were added, the same command passed (1 suite passed; 1 test passed).
  - REFACTOR: no behavior refactor was warranted; Prisma formatting was evaluated, and the final schema retains the repository's existing field-alignment convention. The focused test passed again against the final schema.
- Observed B04.1 checks:
  - Focused persistence Jest test: `npm test -- --runInBand test/appointment-persistence.e2e-spec.ts` — passed (1 suite, 1 test).
  - PostgreSQL integration test: `npm run test:appointment-persistence` — passed and rolled back. It confirmed duplicate active veterinarian slots raise a unique violation, a cancelled slot may coexist, and an accepted request can link its resolved appointment.
  - Prisma validation: `npm run prisma:validate` — passed.
  - Migration deployment: `npm run prisma:migrate:deploy` — passed; no migrations were pending after applying B04.1.
  - Migration status: `npx prisma migrate status` — passed; database schema is up to date.
  - All backend tests: `npm test -- --runInBand` — passed (4 suites, 5 tests).
  - Backend lint: `npm run lint` — passed with no output.
  - Backend build: `npm run build` — passed with no output.
- B04.1 rollback boundary: revert migration `20261005160000_add_appointments_and_requests` only in a fresh database or through a compensating migration in an already deployed database; remove the appointment schema relations, focused test, and this B04.1 evidence. No API endpoint behavior was introduced.
- B04.2 adds JWT- and role-protected staff CRUD endpoints at `/owners` and `/pets`. The four staff roles may access them; owner-role tokens and unauthenticated requests are rejected. Owner emails are trimmed and lowercased, and the services map Prisma uniqueness, restrictive foreign-key, and record-not-found errors to HTTP `409` and `404` responses.
- Pet creation and owner reassignment require an existing owner before persistence. Owner and pet deletes retain the PostgreSQL restrictive foreign-key behavior and return `409` when dependent records prevent deletion.
- TDD evidence for B04.2:
  - RED: `npm test -- --runInBand test/owners-pets.e2e-spec.ts` failed before the verticals existed (1 suite failed; 5 tests failed), returning `404` instead of the expected protected CRUD statuses.
  - GREEN: after implementing the modules, DTOs, controllers, services, and exported guards, the focused command passed (1 suite, 5 tests), covering authorization, validation, CRUD, email normalization, uniqueness, owner existence, ownership reassignment protection, and restrictive deletes.
  - REFACTOR: centralized the allowed staff roles in `auth/staff-roles.ts`; the focused suite passed again (1 suite, 5 tests).
- Observed B04.2 checks:
  - Focused Jest e2e tests: `npm test -- --runInBand test/owners-pets.e2e-spec.ts` — passed (1 suite, 5 tests).
  - All backend tests: `npm test -- --runInBand` — passed (5 suites, 10 tests).
  - Backend lint: `npm run lint` — passed with no output.
  - Backend build: `npm run build` — passed with no output.
  - Prisma validation: `npm run prisma:validate` — passed; schema valid.
- B04.2 rollback boundary: remove `backend/src/owners/`, `backend/src/pets/`, `backend/src/auth/staff-roles.ts`, the guard exports from `backend/src/auth/auth.module.ts`, their imports from `backend/src/app.module.ts`, the focused e2e test, and this B04.2 evidence. B01–B04.1 persistence and authentication behavior remain independent.

## Next step
Implement B04.3: authenticated staff appointment lifecycle endpoints.
