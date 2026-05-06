TaskFlow

Full-stack team project and task management app built with React, Express, and MongoDB.

## Stack

- Frontend: React 18, Vite, Tailwind CSS, Axios, React Router
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, express-validator

## What Changed

- Public signup now always creates `Member` accounts
- Session auth now uses an HTTP-only cookie instead of `localStorage`
- Added `/api/auth/logout` and `/api/auth/me` session bootstrap flow
- Added stricter validation, central error handling, and auth rate limiting
- Enforced project membership when assigning tasks
- Removing a project member now unassigns that user’s tasks in the project
- Deleting a project now deletes its tasks
- Added pagination metadata to project, task, and user list endpoints
- Added `.env.example` files and a root `.gitignore`
- Added `npm run create-admin` for secure admin bootstrap

## Project Structure

```text
team-task-manager/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Local Setup

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
```

Set:

```env
MONGO_URI=mongodb://127.0.0.1:27017/team-task-manager
JWT_SECRET=replace_with_a_long_random_string
PORT=5000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

### 2. Create an Admin Account

Public signup is member-only. Create the first admin from the backend folder:

```bash
npm run create-admin -- "Admin User" admin@example.com StrongPass123
```

### 3. Frontend

```bash
cd ../frontend
npm install
copy .env.example .env
```

Set:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

## Auth Model

- Browser sessions use an HTTP-only cookie set by the backend
- The frontend restores the session with `GET /api/auth/me`
- API tools like Postman can still use `Authorization: Bearer <token>` if needed

## Main Routes

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Projects

- `GET /api/projects?page=1&limit=8`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `POST /api/projects/:id/members`
- `DELETE /api/projects/:id/members/:userId`
- `DELETE /api/projects/:id`

### Tasks

- `GET /api/tasks/dashboard`
- `GET /api/tasks?page=1&limit=10&status=&projectId=`
- `GET /api/tasks/:id`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Users

- `GET /api/users?page=1&limit=100`
- `GET /api/users/profile`

## Security Notes

- Passwords are hashed with bcrypt
- Signup no longer accepts admin role input
- Auth routes are rate-limited
- Sensitive server errors are not exposed in production responses
- CORS is restricted to configured frontend origins

## Build

Frontend production build:

```bash
cd frontend
npm run build
```
