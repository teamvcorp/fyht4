// src/lib/auditLog.ts
import { NextRequest } from 'next/server'
import AuditLog from '@/models/AuditLog'
import dbConnect from '@/lib/mongoose'

export type AuditAction =
  | 'admin.elevate'
  | 'admin.project.update'
  | 'admin.project.delete'
  | 'admin.user.update'
  | 'admin.user.ban'
  | 'admin.settings.update'

export type AuditResource = 'user' | 'project' | 'proposal' | 'donation' | 'settings'

interface LogAuditParams {
  userId: string
  userEmail: string
  action: AuditAction
  resource: AuditResource
  resourceId?: string
  changes?: Record<string, any>
  req?: NextRequest
  status?: 'success' | 'failure'
  errorMessage?: string
}

/**
 * Log an admin action to the audit trail
 */
export async function logAudit(params: LogAuditParams): Promise<void> {
  try {
    await dbConnect()

    const ipAddress = params.req?.headers.get('x-forwarded-for') || 
                     params.req?.headers.get('x-real-ip') || 
                     'unknown'
    
    const userAgent = params.req?.headers.get('user-agent') || 'unknown'

    await AuditLog.create({
      userId: params.userId,
      userEmail: params.userEmail,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      changes: params.changes,
      ipAddress,
      userAgent,
      status: params.status || 'success',
      errorMessage: params.errorMessage,
    })
  } catch (error) {
    // Don't throw - audit logging should never break the main flow
    console.error('Failed to log audit entry:', error)
  }
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(limit = 50) {
  try {
    await dbConnect()
    
    return await AuditLog.find({})
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean()
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
    return []
  }
}

/**
 * Get audit logs for a specific user
 */
export async function getUserAuditLogs(userId: string, limit = 50) {
  try {
    await dbConnect()
    
    return await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean()
  } catch (error) {
    console.error('Failed to fetch user audit logs:', error)
    return []
  }
}

/**
 * Get audit logs for a specific resource
 */
export async function getResourceAuditLogs(
  resource: AuditResource,
  resourceId: string,
  limit = 50
) {
  try {
    await dbConnect()
    
    return await AuditLog.find({ resource, resourceId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'name email')
      .lean()
  } catch (error) {
    console.error('Failed to fetch resource audit logs:', error)
    return []
  }
}
