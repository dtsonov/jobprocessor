import mongoose, { Schema, Document } from 'mongoose';

export enum JobStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface IJob extends Document {
  prompt: string;
  status: JobStatus;
  result?: string;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    prompt: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 5000
    },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.PENDING
    },
    result: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const Job = mongoose.model<IJob>('Job', jobSchema);
