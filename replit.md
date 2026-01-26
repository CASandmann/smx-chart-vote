# SMX Chart Voter

## Overview

SMX Chart Voter is a web application that allows users to vote on StepManiaX chart difficulty ratings. Users can vote whether chart difficulties should be increased or decreased, helping the community rate chart difficulty accuracy. The app fetches chart and song data from an external SMX API and tracks votes per session.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with hot module replacement
- **Theme**: Dark/light mode support with CSS variables

The frontend follows a component-based architecture with:
- Page components in `client/src/pages/`
- Reusable UI components in `client/src/components/ui/` (shadcn/ui)
- Custom components in `client/src/components/`
- Hooks in `client/src/hooks/`

### Performance Optimizations
- **Lazy Loading**: Chart list uses infinite scroll, loading 100 items at a time as user scrolls
- **IntersectionObserver**: Detects when user approaches bottom of list to trigger next batch
- **Filter Reset**: Visible count resets to 100 when search/filter/sort changes

### Backend Architecture
- **Framework**: Express.js 5 on Node.js
- **Session Management**: express-session with MemoryStore
- **API Design**: RESTful endpoints for charts and votes
- **Data Fetching**: Server-side caching of external SMX API data (5-minute cache)

Key backend patterns:
- Routes defined in `server/routes.ts`
- Storage abstraction in `server/storage.ts` (currently in-memory)
- Static file serving in production via `server/static.ts`
- Vite dev server integration in `server/vite.ts`

### Data Storage
- **Database Schema**: Drizzle ORM with PostgreSQL dialect
- **Current Implementation**: In-memory storage (MemStorage class)
- **Schema Location**: `shared/schema.ts`

The schema defines:
- `users` table for user authentication (not actively used yet)
- `votes` table tracking chart votes by session ID

### External Data Integration
The app fetches chart and song data from the SMX API:
- Charts endpoint: `https://smx.573.no/api/charts`
- Songs endpoint: `https://smx.573.no/api/songs`

Data is cached server-side for 5 minutes to reduce API calls.

## External Dependencies

### Third-Party Services
- **SMX API** (`smx.573.no`): External API providing StepManiaX chart and song data including difficulty ratings, cover art, and metadata

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema management and migrations in `./migrations`
- **Drizzle Kit**: Database push via `npm run db:push`

### Key Libraries
- **@tanstack/react-query**: Server state management and caching
- **shadcn/ui + Radix UI**: Accessible UI component primitives
- **Zod**: Runtime type validation for API requests
- **drizzle-zod**: Schema-to-Zod type generation

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string (required for database features)
- `SESSION_SECRET`: Express session secret (defaults to fallback value)