# Job Processor System

A full-stack, production-ready job processing system built with modern tech. Submit tasks, they get queued (mocking n8n), and the UI updates in real-time when processing completes.

## Overview

This system demonstrates a clean, scalable architecture for async job processing with:

- **Backend**: Node.js + TypeScript + Express + Mongoose + MongoDB
- **Frontend**: React + TypeScript + Vite
- **Infrastructure**: Docker + Docker Compose + Terraform/OpenTofu
- **Cloud**: Hetzner Cloud (compute) + Azure OpenAI (AI services)

## Architecture

### System Design

```
┌─────────────────┐
│   React UI      │ (Port 80/5173)
│  - Job List     │
│  - Create Job   │
│  - Polling      │
└────────┬────────┘
         │ HTTP
         ▼
┌──────────────────────┐
│  Node.js Backend     │ (Port 3000)
│  - POST /jobs        │
│  - GET /jobs         │
│  - POST /webhook/cb  │
└─────────┬────────────┘
          │ Mongoose
          ▼
┌──────────────────────┐
│  MongoDB             │ (Port 27017)
│  - Job Collection    │
│  - Persistent Data   │
└──────────────────────┘

Mock n8n Flow:
Backend → (setTimeout 5s) → POST /webhook/callback → Update Job Status
```

### Key Design Decisions

1. **Shared Secret Authentication**: Simple but effective security for the webhook endpoint
2. **Polling Frontend**: Keeps implementation simple without WebSockets complexity
3. **Mock Worker**: Simulates async n8n workflow with setTimeout
4. **Strictly Typed**: TypeScript throughout for safety and clarity
5. **Clean Separation**: Frontend, backend, and infra are independent
6. **Error Resilience**: Handles network failures and malformed responses gracefully

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Terraform (for IaC deployment)

### Run with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Services will be available at:
# Frontend: http://localhost (port 80)
# Backend: http://localhost:3000
# MongoDB: localhost:27017
```

The system will:
1. Create MongoDB container with persistence
2. Build and start the Node.js backend
3. Build and start the React frontend
4. Automatically connect all services

### Local Development

#### Backend

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# The backend will run on http://localhost:3000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# The app will run on http://localhost:5173
```

## API Reference

### POST /jobs
Creates a new job for processing.

**Request**:
```json
{
  "prompt": "Your task description here"
}
```

**Response** (201):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "prompt": "Your task description here",
  "status": "PENDING",
  "createdAt": "2024-01-11T10:30:00Z"
}
```

### GET /jobs
Retrieve all jobs.

**Response** (200):
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "prompt": "First task",
    "status": "COMPLETED",
    "result": "{\"success\": true, \"data\": \"...\"}"
    "createdAt": "2024-01-11T10:30:00Z",
    "updatedAt": "2024-01-11T10:30:05Z"
  },
  {
    "id": "507f1f77bcf86cd799439012",
    "prompt": "Second task",
    "status": "PENDING",
    "createdAt": "2024-01-11T10:31:00Z",
    "updatedAt": "2024-01-11T10:31:00Z"
  }
]
```

### GET /jobs/:id
Retrieve a specific job by ID.

**Response** (200):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "prompt": "Your task",
  "status": "COMPLETED",
  "result": "{\"success\": true}",
  "createdAt": "2024-01-11T10:30:00Z",
  "updatedAt": "2024-01-11T10:30:05Z"
}
```

### POST /webhook/callback
Called by n8n (mocked internally) to update job status. Requires webhook secret.

**Headers**:
```
x-webhook-secret: dev-secret-key
```

**Request**:
```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "result": "{\"success\": true, \"message\": \"Job completed\"}"
}
```

**Response** (200):
```json
{
  "id": "507f1f77bcf86cd799439011",
  "prompt": "Your task",
  "status": "COMPLETED",
  "result": "{\"success\": true, \"message\": \"Job completed\"}",
  "updatedAt": "2024-01-11T10:30:05Z"
}
```

## Infrastructure as Code

The `infrastructure/` folder contains Terraform definitions for hybrid-cloud deployment.

### Hetzner Cloud Resources

- **hcloud_server**: Virtual server to run the application
- **hcloud_network**: Private network for resource communication
- **hcloud_firewall**: Security rules (SSH, HTTP, HTTPS, API)
- **hcloud_ssh_key**: SSH access management

### Azure Resources

- **azurerm_resource_group**: Logical container for resources
- **azurerm_cognitive_account**: OpenAI Service endpoint
- **azurerm_cognitive_deployment**: GPT model deployment

### Deploying Infrastructure

```bash
cd infrastructure

# Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your credentials

# Initialize Terraform
terraform init

# Preview changes
terraform plan

# Apply configuration
terraform apply

# Output deployment information
terraform output
```

**Required Credentials**:
- Hetzner Cloud API Token
- Azure Subscription ID, Client ID, Client Secret, Tenant ID
- SSH public key for server access

## Features & Error Handling

### Frontend Features

 **Real-time Updates**: Polls backend every 2 seconds
 **Job Creation**: Submit prompts with instant feedback
 **Status Tracking**: Visual indicators (PENDING → COMPLETED)
 **Error Handling**: Network failure detection and retry
 **Malformed Response Handling**: Gracefully displays hallucinated/invalid JSON
 **Responsive Design**: Works on all screen sizes

### Error Scenarios

The system gracefully handles:

1. **Network Failures**: Backend unreachable
   - Shows connection error message
   - Disables form submission
   - Auto-detects when connection is restored

2. **Malformed JSON Response**: Simulated hallucination
   - Displays error badge
   - Shows raw response for debugging
   - Prevents app crash

3. **Invalid Input**: Empty or invalid prompts
   - Form validation with helpful messages
   - No server requests for invalid data

4. **Database Issues**: MongoDB connection failure
   - Backend health check fails
   - Docker Compose shows service unhealthy
   - Clear error logs for debugging

## Project Structure

```
fasttrack-task/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Main app entry
│   │   ├── models/
│   │   │   └── Job.ts            # Mongoose schema & interface
│   │   ├── routes/
│   │   │   └── jobs.ts           # Job endpoints + mock worker
│   │   └── middleware/
│   │       └── auth.ts           # Webhook secret validation
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx              # React entry point
│   │   ├── App.tsx               # Main component (polling, UI)
│   │   ├── App.css               # Styled component
│   │   └── index.css             # Global styles
│   ├── Dockerfile
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
│
├── infrastructure/
│   ├── infrastructure.tf         # Hetzner + Azure resources
│   ├── variables.tf              # Variable definitions
│   └── terraform.tfvars.example  # Example values
│
├── docker-compose.yml            # Multi-container orchestration
└── README.md                      # This file
```

## Security

### Webhook Authentication

The `/webhook/callback` endpoint uses a shared secret header for authentication:

```typescript
// Backend validation
const secret = req.headers['x-webhook-secret'];
if (secret !== SHARED_SECRET) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

In production:
- Use environment variables for secrets (✅ done)
- Implement OAuth 2.0 or JWT authentication
- Use HTTPS only
- Rate limit the webhook endpoint
- Log and monitor access

### Database Security

Currently uses basic auth. In production:
- Implement network isolation (private VPC)
- Use strong passwords
- Enable encryption at rest
- Regular backups
- Access control lists

## 🛠️ Development Workflow

### Adding a New Endpoint

1. **Backend** (src/routes/jobs.ts):
```typescript
router.post('/new-endpoint', async (req, res) => {
  // Implementation
});
```

2. **Frontend** (src/App.tsx):
```typescript
const response = await fetch(`${API_BASE}/new-endpoint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### Testing the Mock Worker

The mock n8n callback fires automatically 5 seconds after job creation. To test manually:

```bash
curl -X POST http://localhost:3000/jobs/webhook/callback \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: dev-secret-key" \
  -d '{
    "jobId": "YOUR_JOB_ID",
    "result": "{\"success\": true}"
  }'
```

## Monitoring & Debugging

### Check Service Health

```bash
# Backend health
curl http://localhost:3000/health

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Database Queries (MongoDB)

```bash
# Connect to MongoDB
docker exec -it job-processor-mongodb mongosh -u admin -p password

# List databases
show dbs

# Use job database
use job-processor

# View jobs
db.jobs.find().pretty()

# Count jobs
db.jobs.countDocuments()

# Find specific job
db.jobs.findOne({ _id: ObjectId("...") })
```

### Environment Variables

**Backend** (.env or docker-compose.yml):
- `MONGODB_URI`: MongoDB connection string
- `WEBHOOK_SECRET`: Shared secret for callback validation
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)

**Frontend** (vite.config.ts):
- API endpoint configured for local proxy
- Update if backend runs on different host

## Learning & Code Quality

### TypeScript Patterns Used

-  Strict type checking enabled
-  Interface-based schema definitions
-  Type-safe API responses
-  No `any` types
-  Enum for job status

### Best Practices Implemented

-  Clean separation of concerns (models, routes, middleware)
-  Error handling throughout
-  Input validation
-  Security headers
-  CORS enabled
-  Health checks
-  Proper HTTP status codes
-  Idiomatic React patterns
-  CSS organization
-  Responsive design

## Production Deployment

### Pre-Deployment Checklist

- [ ] Set strong `WEBHOOK_SECRET` in environment
- [ ] Configure MongoDB with strong credentials
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Set up monitoring/alerting
- [ ] Configure backup strategy
- [ ] Set resource limits in docker-compose
- [ ] Update CORS allowed origins
- [ ] Run security audit on dependencies
- [ ] Set up CI/CD pipeline

### Using Infrastructure as Code

```bash
# Deploy to Hetzner + Azure
cd infrastructure
terraform apply -var-file=prod.tfvars

# SSH into server
ssh -i private_key.pem root@<server_ip>

# Deploy application
docker-compose up -d
```

## License

MIT

## Author 
### Dimitar Tsonov

Built as a technical challenge demonstrating full-stack capabilities.

---

**Questions?** Check the code comments and architecture notes throughout the project.
