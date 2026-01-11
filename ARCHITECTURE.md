# Architecture & Design Document

## System Overview

The Job Processor is a full-stack async job processing system with real-time UI updates. It demonstrates production-grade architecture patterns across frontend, backend, and infrastructure.

## Core Components

### 1. Backend (Node.js + TypeScript)

**Purpose**: Process job submissions, manage state, handle n8n callbacks

**Key Files**:
- `src/index.ts`: Express app initialization, MongoDB connection
- `src/models/Job.ts`: Mongoose schema with strict TypeScript typing
- `src/routes/jobs.ts`: API endpoints and mock worker
- `src/middleware/auth.ts`: Webhook secret validation

**Design Patterns**:
- **Repository Pattern**: Mongoose models encapsulate DB operations
- **Middleware Pattern**: Auth validation as reusable middleware
- **Error Handling**: Try-catch blocks with proper HTTP responses
- **Async/Await**: Modern async patterns throughout

**API Endpoints**:
```
POST   /jobs                  Create job
GET    /jobs                  List all jobs
GET    /jobs/:id              Get job by ID
POST   /jobs/webhook/callback Update job (secured)
GET    /health                Health check
```

**Mock Worker Implementation**:
```typescript
// After job creation, automatically call webhook after 5 seconds
setTimeout(() => {
  fetch('/jobs/webhook/callback', {
    headers: { 'x-webhook-secret': WEBHOOK_SECRET }
  })
}, 5000);
```

### 2. Frontend (React + TypeScript)

**Purpose**: Display jobs, accept user input, show real-time updates

**Key Files**:
- `src/App.tsx`: Main component with polling logic
- `src/App.css`: Responsive styles with animations
- `src/main.tsx`: React entry point

**Design Patterns**:
- **Polling**: setInterval every 2 seconds for job updates
- **State Management**: React hooks (useState, useEffect)
- **Error Boundary**: Graceful error handling for network failures
- **Optimistic UI**: Shows job immediately after creation

**Key Features**:
- Real-time job status updates via polling
- Malformed JSON response detection
- Network error detection and recovery
- Responsive mobile-friendly design
- Clean, modern UI with visual feedback

**Polling Strategy**:
```typescript
useEffect(() => {
  const interval = setInterval(() => fetchJobs(), 2000);
  return () => clearInterval(interval);
}, []);
```

### 3. Infrastructure (Docker + Terraform)

**Purpose**: Package and deploy application across cloud providers

#### Docker Compose (Local/Development)

Three containers:
1. **MongoDB**: Data persistence
   - Port: 27017
   - Volume: `mongodb_data` (persistent)
   - Auth: admin/password
   - Health check: mongosh ping

2. **Backend**: Node.js API
   - Port: 3000
   - Build: Dockerfile with TypeScript compilation
   - Depends on: MongoDB (health check)
   - Environment: MONGODB_URI, WEBHOOK_SECRET

3. **Frontend**: React app
   - Port: 80 (Nginx)
   - Build: Multi-stage (build + serve)
   - Depends on: Backend

**Network**: Custom bridge network `job-processor-network`

#### Terraform IaC (Production)

**Hetzner Cloud Resources**:
```hcl
- hcloud_server          Virtual machine
- hcloud_network         Private network
- hcloud_firewall        Security rules
- hcloud_ssh_key         Access control
```

**Azure Resources**:
```hcl
- azurerm_resource_group Container
- azurerm_cognitive_account OpenAI service
- azurerm_cognitive_deployment GPT model
```

**Variables**: Parameterized for dev/staging/prod environments

## Data Flow

### Job Creation Flow
```
User Input
  ↓
React: Form Submit → POST /jobs
  ↓
Backend: Create Job (status=PENDING)
  ↓
MongoDB: Insert Job Document
  ↓
Response: Job Created with ID
  ↓
Frontend: Add to list + Start Polling
  ↓
Mock Worker: setTimeout(5s)
  ↓
Mock Worker: POST /webhook/callback
  ↓
Backend: Validate Secret + Update Job
  ↓
MongoDB: Update Job (status=COMPLETED, result)
  ↓
Frontend: Poll detects update → Display result
```

### Job Status Updates
```
Frontend Poll (every 2s)
  ↓
GET /jobs
  ↓
Backend: Query MongoDB
  ↓
Frontend: Map response to state
  ↓
UI: Re-render with new statuses
```

## Security Architecture

### Authentication & Authorization

1. **Webhook Endpoint Protection**:
   - Shared secret in `x-webhook-secret` header
   - Middleware validates before processing
   - Environment variable in production

2. **Network Security**:
   - MongoDB auth credentials
   - Firewall rules on Hetzner
   - HTTPS ready (needs cert in prod)

3. **Input Validation**:
   - Prompt length limits (1-5000 chars)
   - Type checking (string validation)
   - Empty value rejection

### Potential Enhancements

- OAuth 2.0 for frontend authentication
- JWT tokens for API access
- Rate limiting on endpoints
- Request signing with HMAC
- Encryption at rest for sensitive data
- Audit logging

## Error Handling Strategy

### Frontend Error Scenarios

1. **Network Error**:
   - Catch fetch failure
   - Show error banner
   - Disable form submission
   - Display "Backend unreachable"

2. **Malformed Response**:
   - Try to parse JSON
   - Catch parse error
   - Display as "Hallucinated Response"
   - Show raw response for debugging

3. **Invalid Input**:
   - Validate before submit
   - Show form error
   - Prevent API call

### Backend Error Scenarios

1. **MongoDB Connection**:
   - Retry with exponential backoff
   - Health check endpoint
   - Error logs with timestamps

2. **Invalid Request**:
   - Return 400 with error message
   - Log validation details

3. **Not Found**:
   - Return 404 for missing job
   - Clear error message

## Performance Considerations

1. **Database**:
   - Jobs indexed by _id
   - Sorted by createdAt in queries
   - MongoDB persistence for reliability

2. **Frontend**:
   - Polling interval: 2 seconds (balance between freshness and load)
   - No unnecessary re-renders (React optimizations)
   - CSS animations for smooth UX

3. **Docker**:
   - Alpine base images (smaller size)
   - Multi-stage builds (optimize layers)
   - Health checks (monitoring)

## Scalability & Future Improvements

### Short Term
- Add database indexing for large datasets
- Implement pagination for job list
- Add sorting/filtering
- WebSocket for real-time updates (vs polling)

### Medium Term
- Background job queue (Bull, Kue)
- Job retry logic
- Status webhook history
- Advanced monitoring

### Long Term
- Multi-instance backend (load balancing)
- Distributed MongoDB (sharding)
- Redis caching layer
- CDN for static assets
- Event streaming (Kafka)

## Testing Strategy

### Backend Tests
```typescript
// API endpoint tests
POST /jobs with valid prompt
POST /jobs with invalid prompt
POST /jobs/webhook/callback with valid secret
POST /jobs/webhook/callback without secret
GET /jobs returns correct format
```

### Frontend Tests
```typescript
// Component tests
Form submission
Job list rendering
Polling updates
Error message display
Network error handling
```

### Integration Tests
```bash
docker-compose up
# Run E2E tests
# Verify end-to-end flow
```

## Deployment Runbook

### Local Development
```bash
docker-compose up --build
# Frontend: http://localhost
# Backend: http://localhost:3000
```

### Cloud Deployment (Hetzner + Azure)
```bash
# 1. Prepare infrastructure
cd infrastructure
terraform init
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars

# 2. Get server IP
terraform output hcloud_server_ip

# 3. Deploy application
ssh root@<server_ip>
git clone <repo>
cd fasttrack-task
docker-compose up -d

# 4. Verify
curl http://<server_ip>/health
```

## Monitoring & Observability

### Health Checks
- Backend: `GET /health` → `{ status: "ok" }`
- Docker health checks: Container restart on failure
- Logs: `docker-compose logs -f <service>`

### Metrics to Monitor
- Job processing time (pending → completed)
- API response times
- Error rates (failed jobs, failed requests)
- Database query performance
- Container resource usage

### Logging Strategy
- Backend: Console logs with timestamps
- Docker: Log drivers (json-file default)
- Future: ELK stack, CloudWatch, or DataDog

## Conclusion

This architecture prioritizes:
- **Clarity**: Clean separation, typed code, clear patterns
- **Scalability**: Containerized, cloud-ready, IaC
- **Reliability**: Error handling, health checks, persistence
- **Security**: Webhook auth, validated input, environment isolation
- **Maintainability**: TypeScript, documentation, modular design

Perfect for rapid iteration in a fast-moving team.
