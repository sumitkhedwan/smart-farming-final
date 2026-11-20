# AgriWise

AgriWise is a React and TypeScript farming tools app with a FastAPI service. It includes plant and soil photo screening, user-owned crop records, farm settings, and a small agronomy reference guide.

Production deployment: [https://smart-farming-final.vercel.app](https://smart-farming-final.vercel.app).

> **Model limitation:** the checked-in image models use synthetic demo data. They are not accurate field diagnostics and must not be used to decide pesticide or fertilizer treatments. Market prices and notification delivery are not connected to providers.

## Features

- Email registration with verification, password login, reset, persistent sessions, and logout through Supabase Auth.
- Private profile, farm settings, notification preferences, and crop tracker.
- Supabase Row Level Security policies restrict each user's records to their account.
- Plant and soil image screening with input validation and explicit demo-mode results.
- Location-based current weather, requested only after the user chooses to share location.
- A limited, deterministic farming guide backed by reviewed local reference data; it is not an AI service.
- Responsive English, Hindi, and Marathi interface strings for the supported translated screens.

## Architecture

```text
src/                         React, Vite, React Router, Supabase Auth client
backend/app/main.py          FastAPI routes, validation, rate limiting, SPA fallback
backend/app/models/          Demo and optional trained model inference
backend/data/agronomy.json   Bundled disease and soil reference notes
supabase/migrations/         Profile, farm, and crop schema plus RLS policies
tests/                       FastAPI and upload validation tests
index.py                     Vercel FastAPI entry point
```

The browser talks directly to Supabase Auth and user-owned tables using a publishable key. The key is public by design; the database policies provide authorization. No service-role key is used by the frontend. The FastAPI service handles image screening and the bundled reference endpoint.

## Local setup

Use Python 3.11–3.12 and Node.js 22.12 or newer. From the project folder in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
npm ci
Copy-Item .env.example .env
```

Set the Supabase values in `.env` before trying account features. Then start the API and frontend in separate terminals:

```powershell
npm run api:reload
npm run dev
```

Open `http://localhost:8080`. Vite proxies `/api` requests to FastAPI on port 5000. The API health endpoint is `http://127.0.0.1:5000/health`.

## Supabase setup

1. Create a Supabase project and configure its Auth email provider. For real users, set up a production SMTP provider and enable email confirmation.
2. Apply `supabase/migrations/20261120000000_user_profiles_and_farm_data.sql` with the Supabase CLI (`npx supabase login`, `npx supabase link --project-ref <project-ref>`, then `npx supabase db push`) or the SQL editor.
3. In Supabase Auth URL configuration, set the Site URL to `https://smart-farming-final.vercel.app` and allow these redirects:
   - `http://localhost:8080/auth/callback`
   - `http://localhost:8080/reset-password`
   - `https://smart-farming-final.vercel.app/auth/callback`
   - `https://smart-farming-final.vercel.app/reset-password`
4. Set the minimum password length to 12 and enable breached-password protection if available for the project plan.
5. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`. Never put a service-role key in a `VITE_` variable or commit it.

The migration creates `profiles`, `farm_settings`, `crops`, and `farm_tasks`. RLS is enabled on all four. Profiles are created by a database trigger when a user registers; users can only select or update their own profile. Farm, crop, and task rows use owner checks for all allowed operations. Occupation is profile data, not an authorization role. Email changes remain managed by the verified Auth account. The `supabase/tests/` SQL test checks cross-user read and update isolation.

## Environment variables

| Variable | Purpose | Local example |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key | `your-supabase-publishable-key` |
| `VITE_MAX_UPLOAD_BYTES` | Frontend upload limit in bytes | `10485760` |
| `APP_ENV` | Hides API docs when set to `production` | `demo` |
| `MAX_UPLOAD_BYTES` | API image limit in bytes | `10485760` |
| `MIN_IMAGE_SIDE` | Minimum image width and height | `64` |
| `MAX_IMAGE_PIXELS` | Maximum decoded image pixels | `40000000` |
| `RATE_LIMIT_REQUESTS` | In-process API requests allowed per window | `60` |
| `RATE_LIMIT_WINDOW_SECONDS` | API rate-limit window | `60` |
| `CORS_ORIGINS` | Allowed cross-origin API origins | `http://localhost:8080,http://127.0.0.1:8080` |
| `FRONTEND_DIST` | Built UI directory served by FastAPI | `dist` |

`.env.example` contains placeholders only. `.env`, `.env.*`, local build outputs, datasets, and experimental model weights are ignored by Git.

## Checks

```powershell
python -m pytest -q
npm run lint
npm run typecheck
npm run build
```

The API suite covers health, the image endpoints, validation failures, the farming guide, rate limiting, and browser-route fallback. Production installs use `requirements.txt`; local test tools are in `requirements-dev.txt`. The hosted schema and RLS policies have been applied and checked. Email delivery and authenticated profile journeys still need end-to-end verification after production SMTP and the final redirect URLs are configured.

## Vercel deployment

Vercel detects the FastAPI entry point in `index.py`. The Python build command in `pyproject.toml` runs `npm ci`, builds the Vite UI, then copies the generated `dist` output into `public` so Vercel serves the JavaScript and CSS bundles from its CDN. `vercel.json` sends client routes to the SPA shell, leaves API and asset paths alone, and sets browser security headers. `vercel.json` sets browser security headers.

In Vercel Project Settings, configure these Production environment variables:

```text
APP_ENV=production
FRONTEND_DIST=dist
MAX_UPLOAD_BYTES=4194304
VITE_MAX_UPLOAD_BYTES=4194304
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Vercel Functions have a 4.5 MB request body limit, so the app uses a 4 MiB image limit there. The production URL is `https://smart-farming-final.vercel.app`; set it as Supabase Auth's Site URL and allow the confirmation and password-reset paths listed above. Link the GitHub repository in Vercel Project Settings to enable automatic deployments on pushes. Static route fallback and the API health endpoint are verified on the deployed domain; email confirmation and password reset still require production SMTP and Auth URL configuration.

The built-in rate limiter uses process memory and is best-effort on a serverless platform. Supabase Auth applies its own protection to sensitive Auth operations. For high-traffic production use, enforce API request limits at the platform edge or with a shared rate-limit store.

## Docker

```powershell
docker compose up --build
```

The container serves the UI and API on port 5000. Copy `.env.example` to `.env` first, and set real Supabase values to enable account features.

## Optional model training

`requirements-ml.txt` contains optional TensorFlow training dependencies. `python -m backend.training.train_demo` regenerates synthetic demo data. `backend/training/train_real.py` accepts user-supplied, properly licensed train and validation sets. Do not promote a model to production until it has representative data, independent field validation, and agronomist review. Experimental and pretrained weight files are excluded from the public repository.

## Audit notes and current limitations

The supplied project had a sign-in form that only logged values, no profile or database schema, a chatbot request to a missing route, fabricated dashboard and market metrics, hardcoded personal profile details, an external Lovable script, and no Vercel backend setup. The app now removes the sample personal details and unsupported metrics, adds actual Supabase Auth/profile/farm/crop flows with RLS migrations, implements the missing reference endpoint, validates uploads, serves client routes from FastAPI, and documents honest model and provider limitations.

The Supabase project and user-owned schema are provisioned. Before real-user use, configure the final app URL in Supabase Auth, connect a production SMTP provider, and verify confirmation and password-reset emails end to end. Crop screening still uses demo models and must not guide treatment decisions until a non-demo model has representative field data, independent validation, and agronomist review. Market-feed and notification-delivery integrations also need provider credentials and implementation.

