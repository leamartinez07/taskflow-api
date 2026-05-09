# TaskFlow API

Production-ready REST API for task and project management, built with Next.js 15, TypeScript, Supabase (PostgreSQL), JWT authentication, and Zod validation. Includes an interactive API documentation page at the root route.

## Features

- JWT authentication with register, login, and protected routes
- Project management with full CRUD and ownership control
- Task management with filters by status, priority, assignee, and full-text search
- Comments on tasks
- Role-based access control
- Global middleware for route protection and CORS headers
- Zod validation on all inputs with descriptive error responses
- Interactive API documentation built-in at `/`

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Auth | JWT (jose + bcryptjs) |
| Validation | Zod |
| Deploy | Vercel |

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase project (free tier works)

### Installation

```bash
git clone https://github.com/leamartinez07/taskflow-api.git
cd taskflow-api
npm install
```

### Database Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run the contents of `supabase/schema.sql`
3. Go to Settings → API and copy your keys

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the API documentation.

## API Reference

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register a new user |
| POST | `/api/auth/login` | No | Login, returns JWT token |
| GET | `/api/auth/me` | Yes | Get current user profile |
| PATCH | `/api/auth/me` | Yes | Update name or avatar |

### Projects

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/projects` | Yes | List projects (paginated) |
| POST | `/api/projects` | Yes | Create a project |
| GET | `/api/projects/:id` | Yes | Get project details and tasks |
| PATCH | `/api/projects/:id` | Yes | Update project |
| DELETE | `/api/projects/:id` | Yes | Delete project |

### Tasks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | Yes | List tasks with filters |
| POST | `/api/tasks` | Yes | Create a task |
| GET | `/api/tasks/:id` | Yes | Get task details and comments |
| PATCH | `/api/tasks/:id` | Yes | Update task |
| DELETE | `/api/tasks/:id` | Yes | Delete task |
| POST | `/api/tasks/:id/comments` | Yes | Add a comment |

#### Task filters

```
GET /api/tasks?project_id=uuid&status=todo&priority=high&search=text&page=1&limit=20
```

Available values for `status`: `todo`, `in_progress`, `done`, `cancelled`
Available values for `priority`: `low`, `medium`, `high`, `urgent`

## Project Structure

```
src/
  app/
    api/
      auth/        # register, login, me
      projects/    # CRUD + nested tasks
      tasks/       # CRUD + nested comments
      health/      # status check
    page.tsx       # Interactive API docs
  lib/
    auth.ts        # JWT sign/verify
    supabase.ts    # Supabase client
    schemas.ts     # Zod schemas
    response.ts    # Response helpers
  types/
    index.ts
  middleware.ts    # JWT route protection
supabase/
  schema.sql       # Database tables and indexes
```

## License

MIT
