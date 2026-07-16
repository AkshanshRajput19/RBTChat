# Local Development

This project can now run on localhost without using deployed services.

## What changed

- `aschat-server/.env.local` is used before `aschat-server/.env`
- `aschat-client/.env.local` points the frontend to the local backend
- local MongoDB is set to `mongodb://127.0.0.1:27017/RBTChatLocal`

## Run locally

1. Start MongoDB on your machine.
2. Start the backend from `aschat-server`.
3. Start the frontend from `aschat-client`.
4. Register at least two local accounts if you want the users list to show someone besides yourself.

## Why "No users found" happens

The `/users` endpoint excludes the currently logged-in account. If your local database only has one user, the list will be empty by design.
