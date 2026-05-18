# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sistema Gestion Proyectos** is a monorepo project management system with a TypeScript/React frontend and NestJS backend. It manages projects, commitments (compromisos), deliverables, categories, and user roles with JWT-based authentication.

### Tech Stack

**Backend:**
- NestJS 11 (Node.js framework)
- PostgreSQL (Prisma ORM)
- JWT authentication with Passport
- Express server

**Frontend:**
- React 19 with TypeScript
- Vite (build tool)
- React Router v7 (navigation)
- Tailwind CSS + PostCSS (styling)
- Axios (HTTP client)
- Framer Motion (animations)

## Repository Structure

```
.
├── backend/           # NestJS application
│   ├── src/
│   │   ├── auth/              # JWT authentication (AuthModule, AuthService, JwtStrategy)
│   │   ├── modules/           # Feature modules (categorias, compromisos, proyectos, usuarios, entregables, dashboard)
│   │   ├── common/            # Shared services (EvaluadorProyectoService, VerificadorCompromisosService)
│   │   ├── prisma/            # Database service
│   │   ├── app.module.ts      # Root module
│   │   ├── app.controller.ts
│   │   └── main.ts            # Entry point with CORS & validation
│   ├── prisma/
│   │   └── schema.prisma      # Data models
│   ├── test/                  # E2E tests
│   ├── dist/                  # Compiled output
│   └── package.json
├── frontend/          # React Vite application
│   ├── src/
│   │   ├── components/        # Reusable UI components (modals, forms, cards, layout)
│   │   ├── pages/             # Route pages (Dashboard, Projects, Users, Categories, Login, Settings)
│   │   ├── layouts/           # Layout wrappers (DashboardLayout)
│   │   ├── services/          # API client (axios instance)
│   │   ├── types/             # TypeScript interfaces
│   │   ├── utils/             # Utilities
│   │   ├── App.tsx            # Route definitions
│   │   └── main.tsx           # Entry point with Router
│   ├── public/
│   └── package.json
└── .claude/           # Claude Code configuration
    └── settings.local.json
```

## Database Schema

The Prisma schema defines core entities:

- **Usuario**: Users with roles (ADMIN, SOCIO) and bcrypt-hashed passwords
- **Proyecto**: Projects with state tracking (EN_CURSO, ADVERTENCIA, EN_RIESGO, FINALIZADO), assigned to a leader and secondary partner
- **Compromiso**: Commitments with original and current dates, state tracking (PENDIENTE, CUMPLIDO, NO_CUMPLIDO, REPROGRAMADO)
- **Entregable**: Deliverables with state (PENDIENTE, ADVERTENCIA, URGENTE, VENCIDO, COMPLETADO)
- **Categoria**: Project categories with color coding and ordering
- **HistorialProyecto**: Audit trail for project changes

Key relationships: Proyectos → Categoria, Usuario (leader/partner); Compromisos/Entregables → Proyecto, Usuario (responsible)

## Environment Setup

### Backend (.env)
```
DATABASE_URL="postgresql://postgres:1234@localhost:5432/gestion_proyectos"
JWT_SECRET="<your-secret>"
JWT_EXPIRES_IN=8h
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000
```

Port configuration: Backend runs on **3000**, Frontend Vite dev server on **5173**. CORS is explicitly allowed from the frontend URL.

## Common Commands

### Backend (from `/backend` directory)

```bash
# Install dependencies
npm install

# Development with hot reload
npm run start:dev

# Build for production
npm run build

# Production server
npm run start:prod

# Linting with auto-fix
npm run lint

# Code formatting
npm run format

# Unit tests
npm run test
npm run test:watch      # Watch mode
npm run test:cov        # With coverage

# E2E tests
npm run test:e2e

# Prisma ORM commands
npx prisma migrate dev --name <migration_name>    # Create migration
npx prisma db push                                # Sync schema to database
npx prisma generate                               # Generate Prisma client
npx prisma studio                                 # Open database GUI
```

### Frontend (from `/frontend` directory)

```bash
# Install dependencies
npm install

# Development server (Vite on port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Linting
npm run lint
```

### Root Level

To run both backend and frontend in parallel, you can:
```bash
# Terminal 1: Backend
cd backend && npm run start:dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

## Authentication Flow

1. User logs in via `/login` page sending email/password to POST `/auth/login`
2. Backend validates credentials with bcrypt, issues JWT token
3. Token stored in frontend (typically localStorage)
4. ProtectedRoute component checks token validity; redirects to login if missing
5. JWT passed in Authorization header for authenticated requests
6. JwtStrategy validates and extracts user payload (sub, email, rol) from token

## Backend Module Architecture

Each feature module follows NestJS convention:
- **Controller**: Handles HTTP requests (POST, GET, PATCH, DELETE)
- **Service**: Business logic with Prisma database queries
- **DTO**: Data Transfer Objects for validation (class-validator)

Common modules:
- **ProyectosModule**: CRUD projects, evaluates project state (EvaluadorProyectoService)
- **CompromisosModule**: CRUD commitments, verifies status (VerificadorCompromisosService)
- **EntregablesModule**: CRUD deliverables
- **UsuariosModule**: User management
- **CategoriasModule**: Project categories
- **DashboardModule**: Aggregated metrics
- **AuthModule**: Authentication and JWT logic

PrismaModule is global and auto-injected; CommonModule exports shared services.

## Frontend Component Patterns

- **Pages**: Full-screen route components (Dashboard, Projects, Login, etc.)
- **Modals**: Form overlays for create/edit (ProjectModal, CommitmentModal, etc.)
- **Lists**: Data display components (CommitmentsList, DeliverablesList)
- **Cards**: Reusable card containers (ProjectCard, Badge)
- **Layout**: Sidebar navigation, MainLayout wrapper with routing

API calls use centralized axios instance from `services/api.ts` configured with base URL from `.env`.

## Build & Deployment

**Backend:**
- Compiled TypeScript to `dist/` via `tsc`
- Source maps included (`sourceMap: true` in tsconfig)
- NestJS build command: `nest build`

**Frontend:**
- Vite bundles React into `dist/` with tree-shaking
- TypeScript compiled before Vite build (`tsc -b`)

## Key Development Notes

- **Validation**: Global ValidationPipe in main.ts enforces DTO validation with whitelist and transform options
- **CORS**: Hardcoded to `http://localhost:5173`; production URL in comments suggests multi-env setup needed
- **State Tracking**: Projects, commitments, and deliverables use enums for immutable state values
- **History**: HistorialProyecto model tracks project action audit trail
- **Error Handling**: NestJS exceptions (NotFoundException, UnauthorizedException) used for consistency
- **Password Security**: bcrypt with default salt rounds for user password hashing
