# SMX Chart Voter

A web application for the StepManiaX community to vote on chart difficulty ratings. Users can vote whether chart difficulties should be increased or decreased, helping the community assess difficulty accuracy.

## Features

- Browse all StepManiaX charts with song artwork, difficulty ratings, and pass rate statistics
- Vote charts up or down to suggest difficulty changes (requires login)
- Search by song title or artist
- Filter by difficulty type (Basic, Easy, Hard, Wild, Dual, Full) and difficulty range
- Filter to show only charts you've voted on
- Sort by difficulty level, song title, or vote count
- Lazy loading with infinite scroll for performance
- Dark/light theme support

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Vite
- **Backend**: Express.js 5, Node.js
- **Database**: PostgreSQL (via Drizzle ORM)
- **Authentication**: OpenID Connect (Replit Auth by default)
- **Data Source**: [SMX API](https://smx.573.no) for chart and song data

## Prerequisites

- Node.js 20+
- PostgreSQL database
- A session secret for signing cookies

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. `postgresql://user:pass@host:5432/dbname`) |
| `SESSION_SECRET` | Yes | Secret string for signing session cookies |
| `NODE_ENV` | No | Set to `production` for production mode, defaults to `development` |
| `REPL_ID` | No | Automatically set on Replit; used by Replit Auth |

## Running in Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**: Create a `.env` file or export the variables in your shell:

   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/smxvotes"
   export SESSION_SECRET="your-secret-here"
   ```

3. **Push the database schema**:

   ```bash
   npm run db:push
   ```

4. **Start the dev server**:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`. In development mode, authentication is bypassed and you're automatically logged in as a dummy "Dev User" so you can test voting without needing an auth provider.

## Running in Production

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Build the app**:

   ```bash
   npm run build
   ```

3. **Push the database schema** (if not done already):

   ```bash
   npm run db:push
   ```

4. **Start the production server**:

   ```bash
   NODE_ENV=production node dist/index.cjs
   ```

   The production server serves the built frontend assets and runs on port 5000.

## Authentication Setup

The app uses OpenID Connect for authentication. On Replit, this is handled automatically by Replit Auth (login with Google). If you move the app elsewhere, you'll need to set up your own OpenID Connect provider.

### Using Replit Auth (current setup)

No extra configuration needed. The `REPL_ID` environment variable is set automatically by Replit. Users click "Log in with Replit" and authenticate via Google.

### Switching to a different auth provider

The authentication logic lives in `server/replit_integrations/auth/replitAuth.ts`. To use a different provider:

1. Replace the OpenID Connect configuration in `getOidcConfig()` with your provider's issuer URL
2. Update the callback URL to match your domain
3. Set the appropriate client ID and secret as environment variables
4. Alternatively, swap out the entire auth module with your preferred strategy (e.g. passport-google-oauth20, Auth0, etc.)

## Current Hosting

The app is currently hosted on **Replit** using Replit Deployments. This provides:

- Automatic HTTPS with a `.replit.app` domain
- Built-in PostgreSQL database (Neon-backed)
- Automatic builds and restarts
- Integrated secret management

## Alternative Hosting Options

If you move the app away from Replit, here are some options:

### Railway

- Supports Node.js apps out of the box
- Offers managed PostgreSQL add-on
- Set `DATABASE_URL`, `SESSION_SECRET`, and `NODE_ENV=production` as environment variables
- Deploy via GitHub integration or CLI

### Render

- Free tier available for web services
- Managed PostgreSQL available
- Connect your repo and set the build command to `npm run build` and start command to `node dist/index.cjs`
- Add environment variables in the dashboard

### Fly.io

- Deploy with `fly launch` and a Dockerfile or buildpack
- Attach a Fly Postgres database with `fly postgres create`
- Set secrets with `fly secrets set DATABASE_URL=... SESSION_SECRET=...`

### VPS (DigitalOcean, Linode, etc.)

- Install Node.js 20+ and PostgreSQL
- Clone the repo, install dependencies, build, and run with a process manager like PM2:
  ```bash
  npm install
  npm run build
  npm run db:push
  pm2 start dist/index.cjs --name smx-voter
  ```
- Set up a reverse proxy (nginx/caddy) for HTTPS

### Vercel / Netlify

These are primarily static/serverless platforms. Since this app uses a persistent Express server with sessions, they're **not recommended** without significant refactoring (splitting into serverless API functions and a static frontend).

## Project Structure

```
client/                  # Frontend (React + Vite)
  src/
    components/          # UI components (chart cards, filters, etc.)
    hooks/               # Custom React hooks
    lib/                 # Utilities (query client, etc.)
    pages/               # Page components
server/                  # Backend (Express)
  index.ts               # Server entry point
  routes.ts              # API route definitions
  storage.ts             # Database storage layer
  replit_integrations/   # Auth module
shared/                  # Shared types and schema
  schema.ts              # Drizzle ORM schema + TypeScript types
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/charts` | No | Get all charts with song data |
| GET | `/api/votes` | No | Get vote counts for all charts |
| POST | `/api/votes` | Yes | Cast or update a vote |
| DELETE | `/api/votes/:chartId` | Yes | Remove a vote |
| GET | `/api/auth/user` | Yes | Get current user info |
| GET | `/api/login` | No | Initiate login flow |
| GET | `/api/logout` | No | Log out |
