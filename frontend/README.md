# Frontend Handoff

This frontend is built to run before the backend is ready. By default it uses contract-shaped mocks.

## Environment

Copy `.env.example` to `.env.local` when wiring a backend.

- `NEXT_PUBLIC_USE_MOCKS=true` keeps local mock data enabled.
- `NEXT_PUBLIC_USE_MOCKS=false` sends service calls to `NEXT_PUBLIC_API_BASE_URL`.
- `NEXT_PUBLIC_API_BASE_URL` should point at the backend base URL, for example `http://localhost:4000/api/v1`.

## Contract Endpoints Used

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `GET /auth/me`
- `GET /hotspots`
- `POST /hotspots`
- `GET /hotspots/:id`
- `PATCH /hotspots/:id`
- `DELETE /hotspots/:id`
- `GET /hotspots/:id/packages`
- `POST /packages`
- `PATCH /packages/:id`
- `POST /payments/prepare`
- `POST /payments/verify`
- `POST /sessions/start`
- `POST /sessions/end`
- `GET /sessions/active`
- `POST /ratings`
- `GET /ratings`
- `GET /analytics/owner`
- `GET /admin/users`
- `GET /admin/hotspots`

Admin list services accept either `{ items }` or `{ items, pagination }` inside the standard success `data` object so they can match the current JSON contract while still supporting pagination later.
