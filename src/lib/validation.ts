// src/lib/validation.ts
import validator from 'validator'

/**
 * Validate US ZIP code format and range
 */
export function validateZipcode(zip: string): boolean {
  if (!zip || typeof zip !== 'string') return false
  
  const cleaned = zip.trim()
  if (!/^\d{5}$/.test(cleaned)) return false
  
  const num = parseInt(cleaned)
  // Valid US ZIP code range
  return num >= 501 && num <= 99950
}

/**
 * Validate email and check against common disposable email domains
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  if (!validator.isEmail(email)) return false
  
  // Common disposable email domains to block
  const blacklistedDomains = [
    'tempmail.com',
    '10minutemail.com', 
    'guerrillamail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'getnada.com',
    'maildrop.cc'
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  
  return !blacklistedDomains.includes(domain)
}

/**
 * Validate donation amount with min/max limits
 */
export function validateDonationAmount(amount: number): { 
  valid: boolean
  error?: string 
} {
  if (!Number.isFinite(amount)) {
    return { valid: false, error: 'Invalid amount' }
  }
  
  if (amount < 1) {
    return { valid: false, error: 'Minimum donation is $1' }
  }
  
  if (amount > 100000) {
    return { valid: false, error: 'Maximum donation is $100,000. Contact us for larger donations.' }
  }
  
  return { valid: true }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!password || typeof password !== 'string') {
    return { valid: false, errors: ['Password is required'] }
  }
  
  if (password.length < 16) {
    errors.push('Password must be at least 16 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers')
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain special characters')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate funding goal
 */
export function validateFundingGoal(amount: number): {
  valid: boolean
  error?: string
} {
  if (!Number.isFinite(amount)) {
    return { valid: false, error: 'Invalid funding goal' }
  }
  
  if (amount < 100) {
    return { valid: false, error: 'Minimum funding goal is $100' }
  }
  
  if (amount > 10000000) {
    return { valid: false, error: 'Maximum funding goal is $10,000,000' }
  }
  
  return { valid: true }
}

/**
 * Validate vote goal
 */
export function validateVoteGoal(votes: number): {
  valid: boolean
  error?: string
} {
  if (!Number.isInteger(votes)) {
    return { valid: false, error: 'Vote goal must be a whole number' }
  }
  
  if (votes < 1) {
    return { valid: false, error: 'Minimum vote goal is 1' }
  }
  
  if (votes > 100000) {
    return { valid: false, error: 'Maximum vote goal is 100,000' }
  }
  
  return { valid: true }
}
