# BloodConnect

A full-stack blood donation platform that connects donors and recipients directly. Built with React Native (Expo) and Node.js/Express.

## Architecture

```
BloodConnect/
├── backend/          # Express API + Socket.io server
│   ├── config/       # Environment validation, logger
│   ├── controllers/  # Route handlers
│   ├── middleware/    # Auth, validation, error handling
│   ├── models/       # Mongoose schemas
│   └── routes/       # Express route definitions
├── frontend/         # React Native (Expo) app
│   ├── app/          # Screens (Expo Router file-based routing)
│   ├── components/   # Reusable UI components
│   ├── context/      # React Context providers
│   ├── constants/    # Theme, static data
│   ├── types/        # TypeScript interfaces
│   └── utils/        # API client, storage, platform utils
└── docker-compose.yml
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
| Security | Helmet, express-rate-limit, express-validator |

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

```bash
cd backend
cp .env.example .env    # Fill in your values
npm install
npm run dev             # Starts with nodemon on port 5000
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env    # Set API URL
npm install
npm start               # Starts Expo dev server
```

### Docker (optional)

```bash
# From project root
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
