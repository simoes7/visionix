# AI Agent Instructions for GlassStore

## Purpose
This repository is a full-stack ecommerce starter for a glasses store.
Use this file to understand the codebase boundaries, common patterns, and how to make safe changes across frontend and backend.

## Architecture
- `backend/`: Express + MySQL API using ES modules.
  - Entry: `backend/server.js` imports `backend/app.js`.
  - Routes: `backend/routes/*.js`
  - Controllers: `backend/controllers/*.js`
  - Middleware: `backend/middleware/*.js`
  - Models: `backend/models/*.js`
  - Database config: `backend/config/db.js`
  - Static uploads: `backend/uploads` served at `/uploads`.
- `frontend/`: Vite + React application.
  - Entry: `frontend/src/main.jsx`
  - Routing: `frontend/src/routes/AppRoutes.jsx`
  - API client: `frontend/src/services/api.js`
  - Context providers: `frontend/src/context/*.jsx`
  - Pages: `frontend/src/pages/*.jsx`

## Development commands
- Backend:
  - `cd backend && npm install`
  - `cd backend && npm run dev`
  - `cd backend && npm start`
- Frontend:
  - `cd frontend && npm install`
  - `cd frontend && npm run dev`
  - `cd frontend && npm run build`

## Important conventions
- Backend uses `dotenv` and ES module imports.
- API base path is `/api` and routes are mounted in `backend/app.js`.
- Frontend axios client uses `http://localhost:5000/api` by default.
- Auth token is stored in `localStorage` and attached via axios interceptor in `frontend/src/services/api.js`.
- Protected pages and admin access are enforced in `frontend/src/routes/AppRoutes.jsx` and `frontend/components/common/ProtectedRoute.jsx`.
- Login/register use backend routes under `/api/auth`.
- Customer pages live at `/`, `/shop`, `/product/:id`, `/try-on`, `/cart`, `/checkout`, `/profile`.
- Admin dashboard is at `/admin`.

## When changing backend APIs
- Update the corresponding `backend/routes/*` and `backend/controllers/*`.
- Preserve the existing route patterns where possible:
  - `GET /api/products`
  - `GET /api/products/:id`
  - `POST /api/products` (admin)
  - `PUT /api/products/:id` (admin)
  - `DELETE /api/products/:id` (admin)
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/health`
- Confirm frontend side-by-side changes when routes, request bodies, or response shapes change.

## When changing frontend behavior
- Keep the API client in sync with backend endpoints.
- Use existing contexts for auth, cart, settings, theme, and wishlist.
- For navigation and layouts, use `frontend/src/routes/AppRoutes.jsx` and `frontend/components/layout/*`.
- Use `frontend/src/components/common/Loading.jsx` for loading states when needed.

## Notes for AI agents
- There is no monorepo root package script; frontend and backend are managed separately.
- Use `README.md` for high-level repo context.
- Prefer minimal and consistent changes: update both frontend and backend only when necessary.
- If backend environment variables are required, they are usually located in a `.env` file referenced by `backend/app.js`, but a `.env` file is not included in the repo.
- Do not assume additional services beyond Express, MySQL, React, Vite, and Tailwind.
