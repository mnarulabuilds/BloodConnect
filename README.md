# BloodConnect

A full-stack blood donation platform that connects donors and recipients directly. Built with React Native (Expo) and Node.js/Express.

## Architecture

```
BloodConnect/
├── backend/          # Express API + Socket.io server
│   ├── app.js        # Express app factory (HTTP middleware + routes)
│   ├── server.js     # Process entry: MongoDB, HTTP, Socket.io
│   ├── config/       # Environment validation, logger
│   ├── controllers/  # Route handlers
│   ├── middleware/   # Auth, validation, error handling
│   └── models/       # Mongoose schemas
├── frontend/         # React Native (Expo) app
│   ├── app/          # Screens (Expo Router file-based routing)
│   ├── components/   # Reusable UI components
│   ├── context/      # React Context providers
│   ├── constants/    # Theme, static data
│   ├── types/        # TypeScript interfaces
│   └── utils/        # API client, storage, validation, accessibility helpers
├── docker-compose.yml        # Production-style stack (backend + MongoDB)
├── docker-compose.dev.yml    # Local development stack (frontend + backend + MongoDB)
└── package.json              # Root scripts (Docker dev, combined tests)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native, Expo SDK 54, TypeScript, Expo Router |
| Backend | Node.js, Express 4.x |
| Database | MongoDB (Mongoose) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Real-time | Socket.io (authenticated) |
| Logging | Pino |
| Security | Helmet, express-rate-limit, express-validator, express-mongo-sanitize |

## Run locally with Docker (recommended)

One command starts **MongoDB**, **backend (nodemon)**, and **frontend (Expo web)**:

```bash
npm run dev:docker
```

- Web app: [http://localhost:8081](http://localhost:8081)
- API: [http://localhost:5001](http://localhost:5001) (host port 5001; macOS often reserves 5000 for AirPlay)
- MongoDB: `localhost:27017`

Optional env overrides:

```bash
export JWT_SECRET="$(openssl rand -hex 32)"
export CORS_ORIGIN=http://localhost:8081
npm run dev:docker
```

Stop:

```bash
npm run dev:docker:down
```

## Manual setup

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm start
```

## Testing & coverage

From the repo root:

```bash
npm test
```

- **Backend**: ≥90% coverage on controllers and middleware (`npm run test:backend`)
- **Frontend**: ≥90% line/statement/function coverage on core logic (context, utils, hooks, shared components) (`npm run test:frontend`)

## Production Docker

```bash
export JWT_SECRET=your_secret_here
docker compose up -d
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | No | Register a new user |
| POST | /api/auth/login | No | Login |
| POST | /api/auth/refresh | No | Refresh access token |
| POST | /api/auth/logout | Yes | Logout (invalidate refresh token) |
| POST | /api/auth/forgotpassword | No | Request password reset |
| PUT | /api/auth/resetpassword/:token | No | Reset password |
| GET | /api/donors | No | List eligible donors (paginated) |
| GET | /api/donors/stats | No | Donor statistics |
| GET | /api/requests | No | List blood requests (paginated) |
| POST | /api/requests | Yes | Create blood request |
| PUT | /api/requests/:id | Yes | Update blood request |
| DELETE | /api/requests/:id | Yes | Delete blood request |
| PUT | /api/users/profile | Yes | Update user profile |
| GET | /api/chats | Yes | List user's chats |
| GET | /api/chats/:id | Yes | Get single chat |
| POST | /api/chats | Yes | Start a chat |
| GET | /api/chats/:id/messages | Yes | Get chat messages |
| POST | /api/chats/:id/messages | Yes | Send a message |
| GET | /health | No | Health check |

## License

ISC
