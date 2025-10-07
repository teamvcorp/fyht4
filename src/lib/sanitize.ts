// src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'
import validator from 'validator'

export function sanitizeInput(input: string, options?: {
  allowHTML?: boolean
  maxLength?: number
}): string {
  if (!input) return ''
  
  let clean = validator.trim(input)
  
  if (!options?.allowHTML) {
    clean = validator.escape(clean)
  } else {
    clean = DOMPurify.sanitize(clean, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3'],
      ALLOWED_ATTR: ['href', 'target'],
      ALLOW_DATA_ATTR: false
    })
  }
  
  if (options?.maxLength) {
    clean = clean.substring(0, options.maxLength)
  }
  
  return clean
}

export function sanitizeProjectData(data: any) {
  return {
    title: sanitizeInput(data.title, { maxLength: 200 }),
    description: sanitizeInput(data.description, { allowHTML: true, maxLength: 5000 }),
    shortDescription: sanitizeInput(data.shortDescription, { maxLength: 300 }),
    category: sanitizeInput(data.category, { maxLength: 50 }),
    zipcode: validator.isPostalCode(String(data.zipcode || ''), 'US') ? String(data.zipcode) : '',
    city: sanitizeInput(data.city || '', { maxLength: 100 }),
    state: sanitizeInput(data.state || '', { maxLength: 2 }),
  }
}

export function sanitizeUserInput(data: any) {
  return {
    name: sanitizeInput(data.name || '', { maxLength: 100 }),
    zipcode: validator.isPostalCode(String(data.zipcode || ''), 'US') ? String(data.zipcode) : '',
  }
}
