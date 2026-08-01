# Local Development

This project can now run on localhost without using deployed services.

## What changed

- `aschat-server/.env.local` is used before `aschat-server/.env`
- `aschat-client/.env.local` points the frontend to the local backend
- local MongoDB is set to `mongodb://127.0.0.1:27017/RBTChatLocal`

## Run locally

1. Start MongoDB on your machine.
2. Copy `aschat-server/.env.local.example` to `aschat-server/.env.local`.
3. If you want real AI answers, add your Gemini key in `aschat-server/.env.local`:
   - `GEMINI_API_KEY=your_key_here`
   - or `GOOGLE_API_KEY=your_key_here`
   - optional: `GEMINI_MODEL=gemini-3.5-flash`
4. If you want OTP emails locally, add one of these to `aschat-server/.env.local`:
   - `RESEND_API_KEY` and `RESEND_FROM`
   - `GMAIL_USER` and `GMAIL_PASS` using a Gmail app password
   - or `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER`, and `SMTP_PASS`
5. If mail or SMS is not configured locally, the pricing OTP flow now falls back to a development OTP shown in the UI unless `ALLOW_DEV_OTP_FALLBACK=false`.
6. Install Python requirements from `aschat-server/requirements.txt`.
7. Start the backend from `aschat-server`.
8. Start the frontend from `aschat-client`.
9. Register at least two local accounts if you want the users list to show someone besides yourself.

## AI app notes

- The `AI` page now calls `POST /api/ai/chat` on the backend.
- The backend uses `aschat-server/ai_service.py` as the Gemini gateway.
- Without a provider key, the UI still works but the assistant stays in local fallback mode.
- The UI is locked to Gemini, and you can change the Gemini model from the AI page or via `aschat-server/.env.local`.

## Why "No users found" happens

The `/users` endpoint excludes the currently logged-in account. If your local database only has one user, the list will be empty by design.
