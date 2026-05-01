# E-Champs 🏆

> A modern esports tournament management platform built with Next.js, React, and PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

## Features

### For Tournament Organizers

- **Tournament Creation**: Configure team size, max teams, entry fees, and schedules
- **Payment Verification**: Review and approve payment proofs with admin dashboard
- **Bracket Management**: Automatic double-elimination bracket generation
- **Match Scheduling**: Schedule matches with date/time and venue assignments
- **User Management**: Promote users to admin or ban accounts

### For Participants

- **Tournament Discovery**: Browse available tournaments with filtering
- **Team Registration**: Register teams with payment proof upload
- **Bracket Visualization**: Interactive double-elimination bracket view
- **Match Tracking**: View upcoming matches and results
- **Profile Management**: Update personal information and view tournament history

### Technical Highlights

- **Role-Based Access Control**: Secure admin/user separation with middleware
- **Real-time Updates**: Optimistic updates with React Query cache invalidation
- **Type-Safe API**: Comprehensive TypeScript interfaces across the stack
- **Responsive Design**: Mobile-first esports-themed dark UI
- **Database Migrations**: Version-controlled schema evolution

## Tech Stack

### Frontend

- **Framework**: Next.js 16 (App Router) with React 19
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Phosphor Icons
- **Bracket Visualization**: @g-loot/react-tournament-brackets

### Backend

- **Runtime**: Node.js / Bun
- **Authentication**: Better Auth with PostgreSQL adapter
- **Database**: PostgreSQL (Neon cloud database)
- **Driver**: node-postgres (pg)
- **API**: Next.js App Router API routes

### Development Tools

- **Package Manager**: Bun
- **Linting**: ESLint with Next.js presets
- **Type Checking**: TypeScript strict mode

## Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v15 or higher) or a [Neon](https://neon.tech/) account
- Node.js (v20 or higher) - for compatibility

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/e-champs.git
cd e-champs
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Environment Setup

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"
```

### 4. Database Setup

Run the migrations to create the database schema:

```bash
bun run db:migrate
```

Seed the database with initial data (optional):

```bash
bun run db:seed
```

## Running the Application

### Development Mode

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
bun run build
bun run start
```

## Project Structure

```
e-champs/
├── app/                          # Next.js App Router
│   ├── (main)/                   # Route group: user dashboard
│   │   ├── dashboard/            # User home dashboard
│   │   ├── tournaments/          # Tournament browsing
│   │   ├── my-teams/             # Team management
│   │   ├── my-matches/           # Match schedule
│   │   └── profile/              # User profile
│   ├── admin/                    # Admin-only pages
│   │   ├── tournaments/          # Tournament CRUD
│   │   ├── teams/                # Team verification
│   │   ├── brackets/             # Bracket management
│   │   ├── matches/              # Match management
│   │   ├── schedule/             # Match scheduling
│   │   └── users/                # User management
│   ├── api/                      # API routes
│   │   ├── auth/[...all]/        # Better Auth endpoints
│   │   ├── tournaments/          # Tournament APIs
│   │   ├── teams/                # Team APIs
│   │   ├── matches/              # Match APIs
│   │   ├── brackets/             # Bracket APIs
│   │   └── admin/                # Admin APIs
│   ├── login/                    # Public auth pages
│   ├── register/                 # Registration page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── landing/                  # Landing page sections
│   ├── dashboard/                # User dashboard components
│   ├── admin/                    # Admin interface components
│   └── bracket/                  # Bracket visualization
├── lib/                          # Application logic
│   ├── api/                      # API layer (fetch wrappers)
│   │   ├── tournaments.ts
│   │   ├── teams.ts
│   │   ├── matches.ts
│   │   ├── users.ts
│   │   ├── brackets.ts
│   │   └── index.ts
│   ├── hooks/                    # React Query hooks
│   │   ├── use-tournaments.ts
│   │   ├── use-teams.ts
│   │   ├── use-matches.ts
│   │   ├── use-users.ts
│   │   └── use-brackets.ts
│   ├── auth.ts                   # Server-side auth config
│   ├── auth-client.ts            # Client-side auth
│   ├── db.ts                     # Database connection pool
│   ├── query-client.ts           # React Query config
│   ├── query-keys.ts             # Cache key management
│   └── bracket-transform.ts      # Bracket data transformation
├── db/migrations/                # SQL migrations
├── scripts/                      # Utility scripts
│   ├── migrate.ts                # Migration runner
│   ├── seed.ts                   # Database seeder
│   └── bracket-generator.ts      # Bracket generation
├── types/                        # Additional TypeScript types
└── public/                       # Static assets
```

## Development Guidelines

This project follows strict development patterns documented in `.agents/rules/`:

### API Layer Pattern

- All HTTP requests are centralized in `/lib/api/`
- Type-safe interfaces for all inputs and outputs
- Consistent error handling across all API functions
- Automatic cache invalidation on mutations
- Barrel exports via `index.ts`

### Component Architecture

- **Server Components by default**: Use for data fetching, SEO, and static content
- **Client Components for interactivity**: Mark with `'use client'` directive
- Clear separation in file organization
- Route groups for related pages: `(main)` for users, `admin` for administrators

### Database Patterns

- Use the connection pool from `/lib/db.ts`
- SQL migrations in `/db/migrations/`
- Run migrations with `bun run db:migrate`

### Authentication

- Better Auth configured in `/lib/auth.ts` (server) and `/lib/auth-client.ts` (client)
- Admin plugin enabled for role-based access
- Protected routes use middleware for authentication checks

### Cache Management

- Use React Query with custom hooks in `/lib/hooks/`
- Centralized query keys in `/lib/query-keys.ts`
- Automatic cache invalidation on mutations

## Available Scripts

| Command              | Description                              |
| -------------------- | ---------------------------------------- |
| `bun dev`            | Start development server with hot reload |
| `bun run build`      | Create production build                  |
| `bun run start`      | Start production server                  |
| `bun run lint`       | Run ESLint                               |
| `bun run db:migrate` | Run database migrations                  |
| `bun run db:seed`    | Seed database with sample data           |

## API Endpoints

### Tournaments

- `GET /api/tournaments` - List all tournaments
- `GET /api/tournaments/[id]` - Get tournament details
- `POST /api/tournaments` - Create tournament (admin)
- `PUT /api/tournaments/[id]` - Update tournament (admin)
- `DELETE /api/tournaments/[id]` - Delete tournament (admin)

### Teams

- `GET /api/teams` - List teams
- `POST /api/teams` - Register team
- `PUT /api/teams/[id]/verify` - Verify payment (admin)
- `DELETE /api/teams/[id]` - Withdraw team

### Matches

- `GET /api/matches` - List matches
- `GET /api/matches/[id]` - Get match details
- `PUT /api/matches/[id]` - Update match result (admin)

### Brackets

- `GET /api/brackets/[tournamentId]` - Get tournament bracket
- `POST /api/brackets/[tournamentId]/generate` - Generate bracket (admin)

### Admin

- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/[id]/role` - Update user role
- `DELETE /api/admin/spam` - Clean up spam data

## Contributing

1. Clone the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure:

- TypeScript strict mode passes
- ESLint checks pass
- Follow the existing code patterns
- Update documentation for new features
