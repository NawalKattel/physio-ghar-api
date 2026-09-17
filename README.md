# PhysioGhar Therapist API

The backend for the PhysioGhar **therapist app**: sign-in, profile, schedule and slots, booking requests and sessions, patients, notes and complaints.

Built with NestJS 11, PostgreSQL 17 and TypeORM. The patient app and admin tools have their own APIs and aren't part of this service.

- **Base path:** `/v1`
- **Interactive docs (Swagger):** `http://localhost:3000/api`

---

## Quick start

Requires Node 22+, pnpm and Docker.

```bash
pnpm install
cp .env.example .env          # then set JWT_ACCESS_SECRET (openssl rand -base64 48)
pnpm db:up                    # Postgres in Docker
pnpm migration:run            # create tables
pnpm seed                     # sample data (optional)
pnpm start:dev                # http://localhost:3000
```

Sign in with the seeded therapist: `aarati.joshi@example.com` / `physio123`.

To try the endpoints in Swagger, call `POST /v1/auth/login`, copy `accessToken`, click **Authorize** and paste it.

> **Port 5432 already in use?** Set `DB_PORT` in `.env` to a free port (e.g. `5434`). Docker Compose and the app both read it.

### Seed data

`pnpm seed` fills an empty database with enough data to exercise every endpoint. Nothing in this API creates patients or booking requests, since the patient app owns those.

| Account | Password | What they have |
| --- | --- | --- |
| `aarati.joshi@example.com` | `physio123` | 12 patients, six weeks of slots (4 back, 2 forward), sessions in every status, notes, 5 complaints |
| `suman.lama@example.com` | `physio123` | 2 patients and their own sessions; marked unavailable |

The second therapist exists so you can check that data stays scoped: signing in as one and asking for the other's records returns `404`.

The schedule skips Saturdays and blocks the 13:00 lunch hour from today onward. Past days hold completed sessions and the odd cancellation, today mixes completed and upcoming, and future days hold upcoming sessions plus 6 pending requests on otherwise free times, so `accept` works straight away. Times and patients are picked with a fixed seed, so a fresh database always produces the same data.

The script does nothing if the primary therapist already exists. To start over:

```bash
docker compose down -v && pnpm db:up   # deletes all data
pnpm migration:run
pnpm seed
```

---

## Configuration

All settings come from `.env` and are checked at startup by [src/config/env.validation.ts](src/config/env.validation.ts). If anything is missing or invalid, the app refuses to start and lists every problem.

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test` or `production` |
| `PORT` | `3000` | |
| `DB_HOST` | `localhost` | |
| `DB_PORT` | `5432` | Also the host port Docker publishes |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | — | Required. `.env.example` matches `docker-compose.yml` |
| `DB_LOGGING` | `false` | Log SQL |
| `JWT_ACCESS_SECRET` | — | Required, at least 32 characters |
| `JWT_ACCESS_TTL` | `900` | Access token lifetime, seconds |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | |

---

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm start:dev` | Run with reload on file changes |
| `pnpm build` / `pnpm start:prod` | Compile to `dist/` and run it |
| `pnpm db:up` / `pnpm db:down` | Start / stop the Postgres container |
| `pnpm migration:run` | Apply pending migrations |
| `pnpm migration:revert` | Undo the last migration |
| `pnpm migration:generate src/database/migrations/<Name>` | Generate a migration from entity changes (needs a running DB) |
| `pnpm migration:create src/database/migrations/<Name>` | Create an empty migration |
| `pnpm seed` | Insert sample data (see [Seed data](#seed-data)); does nothing if it's already seeded |
| `pnpm test` / `pnpm test:e2e` | Unit / end-to-end tests |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |

A throwaway test database is available on port 5433: `docker compose --profile test up -d db-test`.

---

## Endpoints

Everything except `/auth/*` needs `Authorization: Bearer <accessToken>`. The therapist is always taken from the token, never from the request.

| Area | Method and path |
| --- | --- |
| **Auth** | `POST /auth/login` · `POST /auth/register` · `POST /auth/refresh` · `POST /auth/logout` |
| **Profile** | `GET /me` · `PATCH /me` · `PUT /me/availability` |
| **Dashboard** | `GET /me/dashboard?date=YYYY-MM-DD` |
| **Slots** | `GET /slots?from=&to=` · `POST /slots` · `POST /slots/{id}/block` · `POST /slots/{id}/unblock` · `DELETE /slots/{id}` |
| **Sessions** | `GET /sessions` · `GET /sessions/{id}` · `POST /sessions/{id}/accept` · `/decline` · `/complete` · `/reschedule` |
| **Patients** | `GET /patients?query=` · `GET /patients/{id}` · `GET /patients/{id}/sessions` |
| **Notes** | `GET /patients/{id}/notes` · `POST /patients/{id}/notes` · `PATCH /patients/{id}/notes/{noteId}` |
| **Complaints** | `GET /complaints` · `POST /complaints` · `GET /complaints/{id}` |

Request and response shapes are in Swagger at `/api`, with the raw OpenAPI JSON at `/api-json`.

### Conventions

- **Dates** are ISO 8601 with an offset (`2026-09-16T10:00:00+05:45`) and are returned in the therapist's time zone. Date-only values are `YYYY-MM-DD`. Datetimes you send must include an offset.
- **IDs** are opaque strings. An unknown or malformed ID returns `404`, and so does another therapist's record, so IDs can't be probed.
- **Paging:** list endpoints take `?limit=` (default 50, max 200) and `?cursor=`, and return `nextCursor`, which is `null` on the last page.
- **Rate limits:** `/auth/*` allows 10 requests per minute per IP; everything else allows 120.

### Errors

Every error has the same shape:

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Some fields are invalid.",
    "fields": { "remarks": "Add remarks before completing" }
  }
}
```

| Code | HTTP | When |
| --- | --- | --- |
| `VALIDATION_FAILED` | 422 | See `fields` for per-field messages |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `UNAUTHORIZED` | 401 | Missing or invalid token, or a refresh token that was revoked |
| `TOKEN_EXPIRED` | 401 | Refresh and retry |
| `EMAIL_TAKEN` | 409 | |
| `SESSION_INVALID_STATUS` | 409 | The action isn't allowed from the current status |
| `SLOT_TAKEN` | 409 | A slot already exists at that time |
| `SLOT_BOOKED` | 409 | The time is booked, or has no open slot when accepting |
| `SLOT_IN_PAST` | 422 | |
| `NOT_FOUND` | 404 | |
| `RATE_LIMITED` | 429 | |

---

## How it works

### Session lifecycle

```text
request ──accept──▶ upcoming ──complete (remarks)──▶ completed
   └──decline──▶ cancelled        └──reschedule──▶ upcoming (new time)
```

Status only changes through these named actions, and the rules live in one place: [src/sessions/session-status.ts](src/sessions/session-status.ts).

- **Accept** needs an unblocked slot at the session's time and no other booking there.
- **Complete** saves the session and creates a patient note from the remarks in one transaction, and returns both.
- **Reschedule** needs an open slot at the new time. The old slot frees up on its own.

### Slots and bookings

A slot's `booked` state is **never stored**. It is worked out by joining slots with `upcoming`/`completed` sessions at the same start time, so the two can't disagree.

Double-booking is prevented by the database: a partial unique index on `sessions (therapist_id, start_at) WHERE status IN ('upcoming','completed')`. Accept and reschedule also lock the session row in a transaction. If two requests race for one time, one succeeds and the other gets `SLOT_BOOKED`.

### Auth

- **Access tokens** are HS256 JWTs lasting 15 minutes.
- **Refresh tokens** (`rt_…`) last 30 days, and only their SHA-256 hash is stored.
- **Every refresh issues a new refresh token** and revokes the old one. If a revoked token is used again, the API assumes it leaked and revokes all of that therapist's refresh tokens.
- **Passwords** are hashed with argon2. A login with an unknown email takes the same time as a wrong password.

### Time zones

Timestamps are stored as UTC (`timestamptz`). Day boundaries, such as "today" on the dashboard or a day in `GET /slots`, use the therapist's `time_zone`, which defaults to `Asia/Kathmandu`.

### Stack

| Concern | Choice |
| --- | --- |
| Framework | NestJS 11 (CommonJS) |
| Database | PostgreSQL 17 in Docker; TypeORM 0.3 with migrations only (`synchronize: false`) |
| Config | `@nestjs/config`, validated with Zod |
| Validation | `class-validator` and `class-transformer`, with one global `ValidationPipe` |
| Auth | `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `argon2` |
| Rate limiting | `@nestjs/throttler` |
| Time zones | `date-fns` and `date-fns-tz` |
| API docs | `@nestjs/swagger` with the CLI plugin, which builds schemas from the DTOs |

### Packages

| Package | Version | Why it's here |
| --- | --- | --- |
| `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` | 11 | The framework and its Express HTTP layer |
| `@nestjs/config` | 4 | Loads `.env` and runs the Zod check at startup |
| `zod` | 4 | Validates environment variables |
| `@nestjs/typeorm`, `typeorm`, `pg` | 11, 0.3, 8 | Postgres access, entities and migrations |
| `class-validator`, `class-transformer` | 0.15, 0.5 | Request validation and type conversion from DTO decorators |
| `@nestjs/jwt` | 11 | Signs and verifies access tokens |
| `@nestjs/passport`, `passport`, `passport-jwt` | 11, 0.7, 4 | Reads the bearer token and populates the signed-in therapist |
| `argon2` | 0.45 | Password hashing |
| `@nestjs/throttler` | 6 | Rate limiting |
| `date-fns`, `date-fns-tz` | 4, 3 | Time-zone conversion and day boundaries |
| `@nestjs/swagger` | 11 | OpenAPI document and the docs page |
| `dotenv` | 17 | Loads `.env` for the TypeORM CLI, which runs outside Nest |

Dev tooling: `@nestjs/cli`, TypeScript 5.7, `ts-node`, Jest with `ts-jest`, `supertest`, ESLint and Prettier.

**Version warning:** this project is Nest 11 compiled to CommonJS. Keep every `@nestjs/*` add-on on its Nest 11 major. The newer majors (`@nestjs/swagger@12`, `@nestjs/typeorm@12`, `@nestjs/jwt@12`, `@nestjs/config@12`, `@nestjs/passport@12`, `typeorm@1`) are ESM-only and crash on startup. `pnpm add @nestjs/<pkg>` installs the newest by default, so pin the major explicitly.

---

## Database schema

UUID primary keys, `timestamptz` everywhere, and snake_case columns. Allowed values for status-like columns are enforced with `CHECK` constraints rather than Postgres enums, which are easier to change in later migrations.

| Table | Key columns | Constraints and indexes |
| --- | --- | --- |
| `therapists` | name, email, phone, password_hash, experience_years, specialization, address, is_available, avatar_url, time_zone | unique `email` (stored lower-cased); experience 0–50 |
| `refresh_tokens` | therapist_id, token_hash, expires_at, revoked_at, replaced_by_id | unique `token_hash` |
| `patients` | name, age, gender, phone, address, condition, treatment_plan | gender `Female`/`Male`/`Other`. Written by the patient app; read-only here |
| `slots` | therapist_id, start_at, duration_minutes, is_blocked | **unique (`therapist_id`, `start_at`)**; duration 15–240 |
| `sessions` | therapist_id, patient_id, start_at, duration_minutes, treatment, visit_type, location, status, remarks, decline_reason | **partial unique (`therapist_id`, `start_at`) where status is `upcoming` or `completed`**; a completed session must have remarks |
| `notes` | therapist_id (author), patient_id, title, body, updated_at, session_id | unique `session_id` (one note per completed session) |
| `complaints` | therapist_id, reference, category, subject, description, status | unique `reference`, filled from a sequence as `PG-C-0001` |

Migrations live in [src/database/migrations/](src/database/migrations/).

---

## Project layout

```text
src/
  main.ts                 # /v1 prefix, validation, error filter, Swagger
  app.module.ts
  config/                 # env validation (Zod), TypeORM options, snake_case naming
  database/
    data-source.ts        # used by the TypeORM CLI
    migrations/
    seeds/seed.ts
  common/                 # errors + filter, validation rules, pagination, time helpers, decorators
  auth/                   # login/register/refresh/logout, JWT strategy and global guard
  therapists/             # /me, availability
  dashboard/
  slots/
  sessions/
  patients/
  notes/
  complaints/
docker-compose.yml        # db (dev) and db-test (profile: test)
```

Each feature folder holds its entity, DTOs, service, controller and module.

### Adding a table or column

1. Change or add the `*.entity.ts`. Properties are camelCase; columns are snake_case automatically.
2. `pnpm migration:generate src/database/migrations/DescribeTheChange`
3. Review the generated SQL, then `pnpm migration:run`.

`synchronize` is off, so schema changes only happen through migrations.

---

## Decisions on unclear parts of the spec

The spec leaves these open. This is how the API behaves today; each is a small change if the product answer differs.

| Question | Current behaviour |
| --- | --- |
| Does accepting a request need a slot? | Yes: an unblocked slot must exist at that time, otherwise `409 SLOT_BOOKED` |
| Can a request whose time has passed be accepted? | No: `422 SLOT_IN_PAST`. Past requests aren't cancelled automatically |
| What is a day off? | Just a day with no slots; there's no working-days setting |
| Dashboard `completedSessions` | Completed sessions on the requested day only |
| Dashboard `pendingRequests` | Requests whose start time is still in the future |
| Rescheduling to a time with no open slot | `422 VALIDATION_FAILED` with `fields.start`. A booked time is `409 SLOT_BOOKED` |
| Deleting a blocked slot | Allowed; only booked slots are refused |
| Password error message | One message ("Use at least 8 characters") covers both length and letter-plus-number |
| Session duration vs. slot duration | Stored separately, both default to 60; not cross-checked |
| Who creates patients and booking requests? | The patient app. This API only reads them; use `pnpm seed` for local data |

## API documentation (Swagger)

Built with [`@nestjs/swagger`](https://docs.nestjs.com/openapi/introduction) 11, which generates an OpenAPI 3 document from the code.

| | |
| --- | --- |
| Docs page | `http://localhost:3000/api` |


To call a protected endpoint from the page: run `POST /v1/auth/login`, copy `accessToken` from the response, click **Authorize**, paste it, then use **Try it out**. The token is remembered across page reloads.

### How it's set up

**[src/main.ts](src/main.ts)** builds the document. `DocumentBuilder` sets the title, version, the tag order used for the sections, and the bearer-token security scheme:

```ts
const config = new DocumentBuilder()
  .setTitle('PhysioGhar Therapist API')
  .setVersion('1.0')
  .addTag('Auth')
  .addBearerAuth()
  .build();
const documentFactory = () => SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, documentFactory);
```

**[nest-cli.json](nest-cli.json)** enables the Swagger CLI plugin, which is what keeps the docs in step with the code without hand-written schemas:

```json
{ "name": "@nestjs/swagger",
  "options": { "classValidatorShim": true, "introspectComments": true,
               "dtoFileNameSuffix": [".dto.ts", ".entity.ts"] } }
```

- **Property types** in DTO classes become the schema, so `remarks: string | null` is documented without an `@ApiProperty` decorator.
- **`classValidatorShim`** turns `class-validator` rules into schema constraints, so `@MaxLength(80)` shows as `maxLength: 80`.
- **`introspectComments`** turns a property's doc comment into its description, and an `@example` tag into its example value:

  ```ts
  export class RescheduleSessionDto {
    /** @example 2026-09-17T11:00:00+05:45 */
    @IsDateTimeWithOffset()
    start!: string;
  }
  ```

  A property with no doc comment still appears, just with no description or example. Worth adding wherever the field name alone doesn't explain the format or the rule.

**Controllers** add what the plugin can't infer:

| Decorator | Purpose |
| --- | --- |
| `@ApiTags('Sessions')` | Which section the endpoints appear under |
| `@ApiBearerAuth()` | Marks the endpoint as needing a token |
| `@ApiOkResponse({ type: SessionDto })` | The success response shape, and `@ApiCreatedResponse` / `@ApiNoContentResponse` for 201 and 204 |
| `@ApiConflictResponse({ type: ApiErrorDto, description: 'SLOT_BOOKED' })` | Error responses, with the error code in the description |

Errors all use `ApiErrorDto` ([src/common/errors/api-error.dto.ts](src/common/errors/api-error.dto.ts)), so every failure in the docs has the same shape as the real response.

### Notes

- The docs are served at `/api`, outside the `/v1` prefix, because `SwaggerModule.setup` ignores the global prefix by default.
- They're currently served in every environment. To hide them in production, wrap the `SwaggerModule` block in `if (process.env.NODE_ENV !== 'production')`.
- To save the spec to a file, e.g. for the app team or a client generator: `curl http://localhost:3000/api-json > openapi.json`.

## Not done yet

- `Idempotency-Key` support on `POST` requests: replay the stored response for a repeated key
- Audit log of reads and writes on patient data (IDs only, never names or conditions)
- Structured logging with redaction (e.g. `nestjs-pino`)
- Automated tests: unit tests for the status rules and date helpers, e2e tests per module against `db-test`, and a race test in which two accepts compete for one slot
- Per-email rate limiting on `/auth/*` (currently per IP only)

## Troubleshooting

- **`pnpm start:dev` compiles, then nothing happens.** An editor extension like Console Ninja can swallow startup errors. Disable it, or run `pnpm build && node dist/main` to see the error.
- **`port is already allocated` from Docker.** Another Postgres is using the port. Change `DB_PORT` in `.env`.
- **Invalid environment at startup.** The message lists each bad variable; compare with `.env.example`.
- **Nest package versions.** This project is Nest 11 compiled to CommonJS. Pin `@nestjs/*` add-ons to their Nest 11 majors (`@nestjs/swagger@11`, `@nestjs/typeorm@11`, `@nestjs/jwt@11`, `@nestjs/config@4`, `@nestjs/passport@11`, `typeorm@0.3`). The newer majors are ESM-only and crash on startup.
