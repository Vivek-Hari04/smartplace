# Backend Architecture Overview

This document provides a high-level guide to the SmartPlace backend, explaining its structure, request flow, and core components.

## 1. Modular Architecture
The backend is built with **Node.js** and **Express** using a **Modular Pattern**. Each feature (e.g., `faculty`, `student`, `admin`, `auth`) is isolated into its own folder under `server/src/modules/`.

### Module Structure
Each module typically consists of three layers:
- **`.routes.js` (The Map)**: Defines the API endpoints (URLs) and specifies which middleware and controller functions should handle them.
- **`.controller.js` (The Brain)**: Handles the HTTP layer. it extracts data from `req.body` or `req.params` and sends back the final JSON response.
- **`.service.js` (The Worker)**: Contains the business logic and raw SQL queries. It interacts directly with the PostgreSQL database.

## 2. Request Lifecycle
When a request is sent to the server (e.g., `GET /api/faculty/courses`):

1.  **Entry Point (`index.js`)**: The request enters the server and hits global middleware (CORS, JSON parsing).
2.  **Authentication (`auth.middleware.js`)**: Every `/api` request is intercepted to validate the **Supabase JWT token** provided in the `Authorization` header.
3.  **Global Router (`router.js`)**: Based on the URL prefix, the request is routed to the specific module (e.g., `/api/faculty` goes to the Faculty module).
4.  **Role Validation (`role.middleware.js`)**: If the route is role-protected, this middleware queries the database to ensure the user has the required permission (e.g., 'admin', 'faculty').
5.  **Controller**: The controller receives the validated request and calls the appropriate service function.
6.  **Service**: The service executes the SQL query using the PostgreSQL `pg` pool and returns the data.

## 3. Core Middleware
- **`auth.middleware.js`**: Decodes the Supabase token and attaches the user object to `req.user`.
- **`role.middleware.js`**: A reusable function that takes a `requiredRole` argument and verifies it against the `users` table.
- **`error.middleware.js`**: Catches any errors thrown during the request cycle and returns a standardized error response to the client.

## 4. API Endpoints
All custom business logic routes are prefixed with `/api`. You can explore the specific endpoints by looking at the `*.routes.js` files in each module.

### Examples:
- **Faculty (`/api/faculty`)**: `/courses`, `/doubts`, `/assessments`.
- **Advisor (`/api/advisor`)**: `/my-students`, `/verify-document/:id`.
- **Public**: Health check (`/`) and base DB tests (`/db`).

## 5. Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (managed via `pg` library)
- **Authentication**: Supabase Auth (JWT validation)
- **Environment**: Dotenv for secret management

---
*Last Updated: March 2026*
