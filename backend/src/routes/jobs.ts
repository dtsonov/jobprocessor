import { Router, Request, Response } from 'express';
import { Job, JobStatus } from '../models/Job';
import { AuthenticatedRequest, validateWebhookSecret } from '../middleware/auth';

const router = Router();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-secret-key';

/**
 * POST /jobs
 * Creates a new job with PENDING status
 * Body: { prompt: string }
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;

    // Validation
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      res.status(400).json({
        error: 'Invalid request: prompt is required and must be a non-empty string'
      });
      return;
    }

    // Create job
    const job = await Job.create({
      prompt: prompt.trim(),
      status: JobStatus.PENDING
    });

    // Simulate async callback from n8n after 5 seconds
    simulateN8nCallback(job._id.toString());

    res.status(201).json({
      id: job._id,
      prompt: job.prompt,
      status: job.status,
      createdAt: job.createdAt
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      error: 'Failed to create job'
    });
  }
});

/**
 * POST /webhook/callback
 * n8n calls this endpoint to update job status
 * Headers: x-webhook-secret (for security)
 * Body: { jobId: string, result: string }
 */
router.post('/webhook/callback', validateWebhookSecret, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { jobId, result } = req.body;

    // Validation
    if (!jobId || !result) {
      res.status(400).json({
        error: 'Invalid request: jobId and result are required'
      });
      return;
    }

    // Update job
    const job = await Job.findByIdAndUpdate(
      jobId,
      {
        status: JobStatus.COMPLETED,
        result: result
      },
      { new: true }
    );

    if (!job) {
      res.status(404).json({
        error: 'Job not found'
      });
      return;
    }

    res.status(200).json({
      id: job._id,
      prompt: job.prompt,
      status: job.status,
      result: job.result,
      updatedAt: job.updatedAt
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      error: 'Failed to update job'
    });
  }
});

/**
 * GET /jobs/:id
 * Retrieve a specific job
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id);

    if (!job) {
      res.status(404).json({
        error: 'Job not found'
      });
      return;
    }

    res.status(200).json({
      id: job._id,
      prompt: job.prompt,
      status: job.status,
      result: job.result,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      error: 'Failed to fetch job'
    });
  }
});

/**
 * GET /jobs
 * Retrieve all jobs
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });

    res.status(200).json(
      jobs.map(job => ({
        id: job._id,
        prompt: job.prompt,
        status: job.status,
        result: job.result,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }))
    );
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      error: 'Failed to fetch jobs'
    });
  }
});

/**
 * Mock n8n callback - simulates AI processing
 * Automatically calls the webhook after 5 seconds
 */
function simulateN8nCallback(jobId: string): void {
  setTimeout(async () => {
    try {
      const mockResult = JSON.stringify({
        success: true,
        message: `Processed job: ${jobId}`,
        timestamp: new Date().toISOString()
      });

      const response = await fetch('http://localhost:3000/jobs/webhook/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': WEBHOOK_SECRET
        },
        body: JSON.stringify({
          jobId,
          result: mockResult
        })
      });

      if (!response.ok) {
        console.error('Webhook callback failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error in mock n8n callback:', error);
    }
  }, 5000);
}

export default router;
