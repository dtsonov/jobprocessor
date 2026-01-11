import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jobsRouter from './routes/jobs';

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/job-processor';

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Routes
app.use('/jobs', jobsRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error'
  });
});

// Connect to MongoDB and start server
async function startServer(): Promise<void> {
  // Wait for MongoDB to be ready and DNS to resolve
  console.log('Waiting for MongoDB to be ready...');
  await new Promise(resolve => setTimeout(resolve, 30000));

  const maxRetries = 30;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI);
      console.log('Connected to MongoDB');

      app.listen(PORT, () => {
        console.log(`Backend server running on port ${PORT}`);
      });
      return;
    } catch (error) {
      retries++;
      console.error(`Connection attempt ${retries}/${maxRetries} failed:`, error);
      if (retries < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retries - 1), 30000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error('Failed to connect to MongoDB after all retries');
  process.exit(1);
}

startServer();
