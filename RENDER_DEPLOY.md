# Render Deployment

This repo is set up to deploy on Render as:

- `aschat-client`: static site
- `aschat-backend`: Node web service

## What is already configured

- Root Blueprint file: [render.yaml](./render.yaml)
- Backend health check: `/api/test`
- Frontend SPA rewrite to `/index.html`
- Backend uploads stored on a persistent disk via `UPLOADS_DIR`
- Frontend build env vars wired from the backend service URL
- OTP login disabled by default in production unless you explicitly set `OTP_LOGIN_ENABLED=true`

## Required before deploy

1. Push this repo to GitHub.
2. Create a MongoDB connection string for production.
   - Easiest option: MongoDB Atlas.
   - Alternative: run MongoDB on Render as a separate service.
3. In Render, create a new Blueprint and point it to this repo.
4. When prompted, provide `MONGODB_URI`.

## Important notes

- The backend is configured with a persistent disk for `/uploads`.
- Render persistent disks require a paid web service plan, so the backend is set to `starter`.
- The frontend can stay on the free static plan.
- If you want email OTP, SMTP, Gmail, or Twilio-based features in production, add the corresponding environment variables in the backend service after deploy.

## Suggested backend env vars

- `MONGODB_URI` (required)
- `JWT_SECRET` is generated automatically by Render
- `CLIENT_URL` is wired automatically from the frontend service URL
- `UPLOADS_DIR` is set automatically by the Blueprint
- `OTP_LOGIN_ENABLED=false` by default

## Optional backend env vars

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `GMAIL_USER`
- `GMAIL_PASS`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM`

## After deploy

Check:

- Frontend opens at the Render static site URL
- Backend responds at `/api/test`
- Registration and login work
- Uploads, stories, and media messages work
