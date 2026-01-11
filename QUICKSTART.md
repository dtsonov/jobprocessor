# Quick Start Guide

## 5-Minute Setup

### Option 1: Docker Compose (Recommended)

```bash
# Navigate to project root
cd <path>\fasttrack-task

# Run everything
docker-compose up --build

# Wait for services to start...
#  Frontend: http://localhost
#  Backend: http://localhost:3000
#  MongoDB: localhost:27017
```

**That's it!** Open http://localhost in your browser.

### Option 2: Local Development

#### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
# Backend runs on http://localhost:3000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

#### Terminal 3 - MongoDB (Docker)
```bash
docker run -d -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7
```

---

## Usage

### Creating a Job

1. **Enter a prompt** in the textarea
2. **Click "Submit Job"**
3. **Wait** - job appears as PENDING
4. **After 5 seconds** - status changes to COMPLETED
5. **See the result** - JSON response displayed

### What Happens Behind the Scenes

```
1. Frontend: Submit prompt
2. Backend: Create job in MongoDB
3. Backend: Start 5-second timer
4. Frontend: Poll for updates every 2 seconds
5. Backend: Auto-trigger webhook callback
6. Frontend: Detect status change, update UI
```

---

## Testing Error Handling

### Test 1: Network Error
```bash
# In another terminal
docker-compose stop backend

# Try to submit a job
# → See "Backend connection failed" error

docker-compose start backend
# → Connection automatically restores
```

### Test 2: View Raw API Response
```bash
# Get all jobs
curl http://localhost:3000/jobs

# Get specific job
curl http://localhost:3000/jobs/{jobId}

# Create job manually
curl -X POST http://localhost:3000/jobs \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test prompt"}'
```

### Test 3: Manual Webhook Callback
```bash
# Get a job ID first, then:
curl -X POST http://localhost:3000/jobs/webhook/callback \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: dev-secret-key" \
  -d '{
    "jobId": "YOUR_JOB_ID",
    "result": "{\"success\": true, \"message\": \"Manually completed\"}"
  }'
```

---

## View Database

### Using MongoDB Shell

```bash
# Connect to container
docker exec -it job-processor-mongodb mongosh -u admin -p password

# Commands
show dbs                          # List databases
use job-processor                 # Use job database
db.jobs.find().pretty()           # View all jobs
db.jobs.countDocuments()          # Count jobs
db.jobs.findOne({...})            # Find specific job
db.jobs.deleteMany({})            # Clear all jobs
```

---

## Check Service Health

```bash
# Backend health
curl http://localhost:3000/health

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Show running containers
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Environment Variables

### Backend (.env or docker-compose)
```
MONGODB_URI=mongodb://admin:password@mongodb:27017/job-processor?authSource=admin
WEBHOOK_SECRET=dev-secret-key
PORT=3000
NODE_ENV=production
```

### Frontend
- Automatically proxies API calls to `http://localhost:3000`
- See `frontend/vite.config.ts` for configuration

---

## Common Issues

### Issue: "Cannot connect to MongoDB"
```bash
# Check if MongoDB container is running
docker-compose ps

# If not, restart
docker-compose restart mongodb

# View logs
docker-compose logs mongodb
```

### Issue: "Port 80 already in use"
```bash
# Change in docker-compose.yml
# Change: ports: ["80:80"]
# To:     ports: ["8080:80"]

# Then access frontend at http://localhost:8080
```

### Issue: "Backend not responding"
```bash
# Check backend logs
docker-compose logs backend

# Verify health
curl http://localhost:3000/health

# Restart backend
docker-compose restart backend
```

### Issue: "npm ERR! ENOENT: no such file or directory"
```bash
# Make sure you're in the right directory
cd backend  # or cd frontend
npm install
```

---

## Build for Production

### Backend
```bash
cd backend
npm run build
docker build -t job-processor-backend .
docker run -p 3000:3000 \
  -e MONGODB_URI="..." \
  -e WEBHOOK_SECRET="..." \
  job-processor-backend
```

### Frontend
```bash
cd frontend
npm run build
docker build -t job-processor-frontend .
docker run -p 80:80 job-processor-frontend
```

---

## Deploy to Cloud

### Hetzner + Azure
```bash
cd infrastructure

# Copy example config
cp terraform.tfvars.example terraform.tfvars

# Edit with your credentials
# (See file for required values)

# Initialize
terraform init

# Preview changes
terraform plan

# Deploy
terraform apply

# Get server IP
terraform output hcloud_server_ip

# SSH and deploy application
ssh root@<server_ip>
git clone <repo>
cd fasttrack-task
docker-compose up -d
```

---

## Files to Read

1. **[README.md](README.md)** ← Full documentation
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** ← Design & patterns
3. **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** ← What was built
4. **[backend/README.md](backend/README.md)** ← Backend details
5. **[frontend/README.md](frontend/README.md)** ← Frontend details

---

## Key Commands Summary

| Command | Purpose |
|---------|---------|
| `docker-compose up --build` | Start everything |
| `docker-compose down` | Stop everything |
| `docker-compose logs -f backend` | View backend logs |
| `curl http://localhost:3000/health` | Check backend health |
| `cd backend && npm run dev` | Local backend development |
| `cd frontend && npm run dev` | Local frontend development |
| `cd infrastructure && terraform apply` | Deploy to cloud |

---
