# Backend

This is the Node.js + TypeScript backend for the Job Processor system.

## Features

- **Typed Database**: Mongoose with strict TypeScript interfaces
- **REST API**: Clean endpoints for job management
- **Mock Worker**: Simulates n8n workflow with automatic callbacks
- **Webhook Security**: Shared secret validation
- **Error Handling**: Comprehensive error management

## Architecture

### Models

- **Job**: MongoDB collection with typed schema
  - `prompt`: Task description
  - `status`: PENDING | COMPLETED | FAILED
  - `result`: Processing result (JSON string)
  - `timestamps`: Auto-managed createdAt/updatedAt

### Routes

- `POST /jobs`: Create new job
- `GET /jobs`: Get all jobs
- `GET /jobs/:id`: Get specific job
- `POST /jobs/webhook/callback`: Update job (webhook)

### Middleware

- **Auth**: Validates webhook secret header

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
docker build -t job-processor-backend .
docker run -p 3000:3000 -e MONGODB_URI=mongodb://localhost:27017/job-processor job-processor-backend
```

## Environment Variables

```
MONGODB_URI=mongodb://admin:password@localhost:27017/job-processor?authSource=admin
WEBHOOK_SECRET=dev-secret-key
PORT=3000
NODE_ENV=production
```
