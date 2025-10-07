// src/models/AuditLog.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAuditLog extends Document {
  userId: mongoose.Types.ObjectId
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  status: 'success' | 'failure'
  errorMessage?: string
  timestamp: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'admin.elevate',
        'admin.project.update',
        'admin.project.delete',
        'admin.user.update',
        'admin.user.ban',
        'admin.settings.update',
      ],
      index: true,
    },
    resource: {
      type: String,
      required: true,
      enum: ['user', 'project', 'proposal', 'donation', 'settings'],
    },
    resourceId: {
      type: String,
      index: true,
    },
    changes: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    status: {
      type: String,
      enum: ['success', 'failure'],
      default: 'success',
      index: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'timestamp', updatedAt: false },
  }
)

// Index for querying recent admin actions
AuditLogSchema.index({ timestamp: -1 })
AuditLogSchema.index({ userId: 1, timestamp: -1 })
AuditLogSchema.index({ action: 1, timestamp: -1 })

// Prevent model re-compilation in development
const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)

export default AuditLog
