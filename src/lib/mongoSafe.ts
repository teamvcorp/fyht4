// src/lib/mongoSafe.ts
import { Types } from 'mongoose'

/**
 * Safely convert a string to MongoDB ObjectId
 * Returns null if invalid
 */
export function safeObjectId(id: string | undefined | null): Types.ObjectId | null {
  if (!id || typeof id !== 'string') return null
  if (!Types.ObjectId.isValid(id)) return null
  return new Types.ObjectId(id)
}

/**
 * Sanitize MongoDB query to prevent NoSQL injection
 * Removes any keys starting with $ (MongoDB operators)
 */
export function safeQuery(query: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(query)) {
    // Block MongoDB operators in keys
    if (key.startsWith('$')) continue
    
    // Recursively sanitize nested objects
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = safeQuery(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Validate and sanitize MongoDB update operations
 */
export function safeUpdate(update: Record<string, any>, allowedFields: string[]): Record<string, any> {
  const sanitized: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(update)) {
    // Only allow specific fields
    if (!allowedFields.includes(key)) continue
    
    // Don't allow operator keys in values
    if (typeof value === 'object' && value !== null) {
      const hasOperator = Object.keys(value).some(k => k.startsWith('$'))
      if (hasOperator) continue
    }
    
    sanitized[key] = value
  }
  
  return sanitized
}
