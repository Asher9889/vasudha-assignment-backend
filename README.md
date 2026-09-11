# Vasudha Foundation Data Platform — Backend API

REST API powering the Vasudha Foundation climate, energy and power data platform. Handles authentication, CSV dataset ingestion with visualization configuration, a super-admin approval workflow, and password reset emails.

## Features

- JWT authentication with rotating access/refresh tokens in HTTP-only cookies
- Role-based access for `ADMIN` and `SUPER_ADMIN`
- CSV upload, parsing, validation, and column type inference (`NUMBER` / `STRING` / `DATE`)
- Dataset creation with template-based visualization configuration (lat-long, state-wise, time-series)
- Super-admin approval workflow (`PENDING` → `APPROVED` / `REJECTED`); approved datasets are exposed via public endpoints
- Super-admin user management (create admins, enable/disable accounts)
- Forgot / reset password with hashed, time-limited reset tokens
- Background email delivery via BullMQ (user creation, password reset)

## Tech Stack

| Area | Technology |
| --- | --- |
| Runtime | Node.js, TypeScript, Express 5 |
| Database | MongoDB (Mongoose 9) |
| Queue  | Redis + BullMQ |
| Auth | JSON Web Tokens (`jsonwebtoken`), Argon2 |
| Validation | Zod |
| File upload | Multer, `csv-parser` |
| Email | Nodemailer (SMTP) |
| Logging | pino / pino-http |
| Tests | Vitest |

## Architecture

The server is a single Express app (no monolith split): `src/server.ts` wires middleware (CORS allowlist, pino logging, `cookie-parser`, JSON body parsing), mounts routes under `/api/v1`, and registers a global error handler. MongoDB connects at import time.

Routes are split into feature modules, each with its own controller, service, schema (Zod) and routes:

```
src/
├── server.ts                 # Express bootstrap
├── db/                       # Mongoose connection
├── routes/                   # /api/v1 routing
├── middlewares/              # authenticate, authorize, zod validators, http logger
├── modules/
│   ├── auth/                 # login, refresh, me, logout
│   ├── user/                 # super-admin user management
│   ├── dataset/              # CSV upload, dataset CRUD, approval
│   ├── password-reset/       # forgot/reset password + token model
│   └── email/                # BullMQ queue, worker, nodemailer templates
├── events/                   # in-process EventBus (EventEmitter)
├── seeders/                  # super-admin seeder
└── utils/                    # ApiError, ApiResponse helpers
```

An in-process event bus emits `USER_CREATED` and `PASSWORD_RESET_REQUESTED`; an email listener enqueues corresponding BullMQ jobs, which a worker processes via SMTP. All requests return a normalized `{ success, statusCode, message, data }` envelope, and errors use `ApiError`.

## Authentication & Authorization

- Login issues two JWTs (`accessToken`, `refreshToken`) in HTTP-only cookies with `SameSite=strict` (`Secure` when `NODE_ENV=production`). The refresh endpoint rotates both tokens. Logout clears the cookies (no server-side revocation).
- `authenticate` middleware verifies the access token and requires an `ACTIVE` account; `authorize(...roles)` guards super-admin-only routes.
- Roles: `ADMIN` (submit datasets, view own datasets) and `SUPER_ADMIN` (approve/reject, manage users and all datasets).
- Password reset: `forgot-password` stores only a SHA-256 hash of the reset token (with a TTL index) and emails a link to `<FRONTEND_URL>/reset-password?token=...`. `reset-password` validates the token and updates the Argon2-hashed password. Responses are identical whether or not the email exists.

## Dataset Flow

```
CSV upload → parsing/validation → column schema detection → visualization configuration → dataset creation → super-admin approval → public publication
```

- `POST /datasets/upload` stores the CSV to disk, parses it, validates headers and rows, and infers column types (`NUMBER`, `STRING`, `DATE`). Invalid rows are counted but do not block the upload.
- A dataset records a `title`, `domain` (`CLIMATE` / `ENERGY` / `POWER`), a `templateType` (`LAT_LONG` / `STATE_WISE` / `TIME_SERIES`), matching `chartType` (`INDIA_MAP` / `STATE_HEATMAP` / `LINE` / `BAR` / `AREA`), a `csvSchema` of detected columns, and a `visualizationConfig` mapping dataset columns (latitude/longitude, state, value, x-axis) required by the chosen template.
- Only rows that pass validation are persisted into the `dataset_rows` collection.
- `PATCH /datasets/:id/status` (super-admin) approves or rejects. Approval stamps `approvedBy`, `approvedAt` and `publishedAt`; rejection requires a `rejectionReason`. Approved datasets are the only ones visible through the public endpoints, while admins only see datasets they uploaded and super-admins see everything.

## API

All endpoints are relative to `/api/v1`. Auth rows marked "Access token" require the signed-in access-token cookie; "Super admin" additionally requires the `SUPER_ADMIN` role.

### Auth

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | — | Log in (`email`, `password`), sets auth cookies |
| POST | `/auth/refresh` | Access token | Rotate access/refresh tokens |
| GET | `/auth/me` | Access token | Current user profile |
| POST | `/auth/logout` | — | Clear auth cookies |
| POST | `/auth/forgot-password` | — | Send reset link (`email`); generic response whether or not the account exists |
| POST | `/auth/reset-password` | — | Set new password (`token`, `password`) |

### Users (super admin)

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/users` | Super admin | List admin accounts (paginated, searchable) |
| POST | `/users` | Super admin | Create a user (`email`, `password`, `role`, `accountStatus`) |
| PATCH | `/users/:id/status` | Super admin | Enable/disable an `ADMIN` account |

### Datasets

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/datasets/upload` | — | Upload + validate CSV (`multipart/form-data`, field `file`) |
| POST | `/datasets` | — | Create a dataset from an uploaded `fileKey` |
| GET | `/datasets` | Access token | List datasets (admins: own; super-admin: all) |
| GET | `/datasets/:id` | — | Get any dataset with rows (any status) |
| GET | `/datasets/public` | — | List approved datasets |
| GET | `/datasets/public/:id` | — | Get an approved dataset with rows |
| PATCH | `/datasets/:id/status` | Super admin | Approve/reject (`status`, optional `rejectionReason`) |

## Environment Variables

Configuration is read from `.env` (loaded via `--env-file`). Copy `.env.sample` and fill in values.

| Variable | Purpose |
| --- | --- |
| `PORT` | Server listen port |
| `NODE_ENV` | `development` / `production` (controls cookie `Secure` flag) |
| `MONGODB_URL` | MongoDB connection string |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Credentials used by the super-admin seeder |
| `JWT_ACCESS_TOKEN_SECRET` / `JWT_REFRESH_TOKEN_SECRET` | JWT signing secrets |
| `JWT_ACCESS_TOKEN_MAX_AGE` / `JWT_REFRESH_TOKEN_MAX_AGE` | Token lifetimes (ms or `ms`-style durations, e.g. `15m`) |
| `REDIS_SERVER_HOST` / `REDIS_SERVER_PORT` / `REDIS_SERVER_PASSWORD` | Redis connection for BullMQ |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | SMTP transport for outgoing email |
| `MULTER_FILE_SIZE_LIMIT` | Max CSV upload size in MB |
| `FRONTEND_URL` | Base URL used to build password reset links |
| `PASSWORD_RESET_TOKEN_TTL_MS` | Reset token lifetime (default `600000`, 10 min) |

## Local Development

```bash
npm install
cp .env.sample .env        # fill in required values
npm run seed:super-admin   # create the super admin (uses SUPER_ADMIN_* env)
npm run dev                # start dev server (tsx --watch)
```

```bash
npm run build              # compile with tsc → dist/
npm start                  # run the compiled build
npm test                   # password-reset service tests (Vitest)
```

## Database

MongoDB (via `MONGODB_URL`) with collections:

- `users` — `email` (unique), Argon2-hashed `password`, `role`, `accountStatus`
- `datasets` — metadata, `csvSchema`, `visualizationConfig`, `status`, approval timestamps; indexed on `status`, `uploadedBy`, `domain+status`, `publishedAt`
- `dataset_rows` — row data keyed by `datasetId` + `rowIndex` (unique)
- `password_reset_tokens` — `tokenHash` (SHA-256), `expiresAt` with a TTL index, `usedAt`

Redis hosts the BullMQ email queue (`vasudha-email`).


## Security

- Argon2 password hashing on the `User` model
- HTTP-only, `SameSite=strict` auth cookies (`Secure` in production)
- Reset tokens stored only as SHA-256 hashes with a TTL index
- Zod validation on request body, query, and params
- CORS origin allowlist
- RBAC via `authorize(...)` for super-admin routes

Note: dataset upload/create and generic dataset detail are currently unauthenticated, and no rate limiting is applied.