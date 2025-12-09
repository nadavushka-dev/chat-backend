# chat-node

A real-time chat backend built to learn backend development and prepare for DevOps exploration.

## Tech Stack

- **Runtime:** [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Framework:** [Express 5](https://expressjs.com/)
- **Real-time:** [Socket.io](https://socket.io/)
- **Database:** [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- **Validation:** [Zod](https://zod.dev/)

## Project Goals

This project is part of my transition from frontend to backend development. The plan:

1. Build a functional backend with REST + WebSockets
2. Deploy to a VPS
3. Learn DevOps: CI/CD pipelines, nginx, Docker, Kubernetes

## What I Learned

### Security
- Input validation with Zod to prevent SQL injection
- Payload size limits (request body + socket messages)
- Safe field selection (no password exposure)

### Architecture
- Graceful shutdown handling (SIGTERM/SIGINT)
- Global error handling + 404 catch-all
- Reusable validation patterns (DRY)

### Real-time
- Socket.io room management (join/leave/broadcast)
- Message validation before persistence
- Error emission to clients

## API Overview

### REST Endpoints
- `GET /rooms` - List all rooms
- `GET /rooms/:id` - Get room participants
- `GET /rooms/:id/messages` - Get room messages
- `POST /rooms` - Create a room
- `POST /rooms/:id/messages` - Create a message
- `GET /users` - List all users

### Socket Events
- `join_room` / `leave_room` - Room management
- `message` - Send a message
- `deliver` - Receive a message
- `error` - Error notifications

## Roadmap

- [x] Express server with TypeScript
- [x] PostgreSQL + Prisma setup
- [x] REST API (users, rooms, messages)
- [x] Real-time messaging with Socket.io
- [x] Input validation (Zod)
- [x] Error handling (global + 404)
- [x] Graceful shutdown
- [x] Payload size limits
- [ ] Authentication (JWT)
- [ ] Rate limiting
- [ ] Docker containerization
- [ ] VPS deployment
- [ ] CI/CD pipeline
- [ ] Nginx reverse proxy
- [ ] Kubernetes (stretch goal)

## Related

A React frontend client is being developed alongside this backend.
