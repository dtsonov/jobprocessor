import { Request, Response, NextFunction } from 'express';

const SHARED_SECRET = process.env.WEBHOOK_SECRET || 'dev-secret-key';

export interface AuthenticatedRequest extends Request {
  isWebhook?: boolean;
}

export const validateWebhookSecret = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const secret = req.headers['x-webhook-secret'] as string;

  if (!secret || secret !== SHARED_SECRET) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or missing webhook secret'
    });
    return;
  }

  req.isWebhook = true;
  next();
};
