// src/lib/rateLimit.ts
import rateLimit from 'express-rate-limit'
import { NextRequest, NextResponse } from 'next/server'

// Rate limiter configuration for different endpoints
export const rateLimiters = {
  // Strict: Admin elevation and authentication
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // 3 attempts per window
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
  
  // Moderate: Voting, donations
  moderate: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 requests per hour
    message: 'Too many requests. Please try again later.',
  },
  
  // Standard: General API endpoints
  standard: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Rate limit exceeded. Please try again later.',
  },
}

// Simple in-memory rate limiter (for Next.js edge compatibility)
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function checkRateLimit(
  identifier: string,
  config: { windowMs: number; max: number; message: string }
): { allowed: boolean; response?: NextResponse } {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || entry.resetTime < now) {
    // Create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return { allowed: true }
  }

  if (entry.count >= config.max) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      allowed: false,
      response: NextResponse.json(
        { error: config.message, retryAfter },
        { 
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(config.max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
          }
        }
      ),
    }
  }

  // Increment count
  entry.count++
  return { allowed: true }
}

export function getRateLimitIdentifier(req: NextRequest, userId?: string): string {
  // Use user ID if authenticated, otherwise use IP
  if (userId) return `user:${userId}`
  
  const ip = req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'unknown'
  
  return `ip:${ip}`
}
