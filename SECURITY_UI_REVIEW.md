# 🔒 FYHT4 Comprehensive Security & UI Review
**Generated:** October 6, 2025

## 📊 EXECUTIVE SUMMARY

### Security Status: ⚠️ MODERATE RISK
- **Critical Issues**: 3
- **High Priority**: 8
- **Medium Priority**: 12
- **UI/UX Improvements**: 15

---

## 🚨 CRITICAL SECURITY ISSUES

### 1. **NO RATE LIMITING** ⚠️ CRITICAL
**Risk**: Brute force attacks, DDoS vulnerability, API abuse

**Affected Endpoints**:
- `/api/admin/elevate` - Password brute force
- `/api/projects/[id]/vote` - Vote manipulation
- `/api/wallet/*` - Financial transaction spam
- `/api/auth/*` - Authentication attacks

**Solution**: Implement rate limiting
```bash
npm install express-rate-limit next-rate-limit
```

**Implementation**:
```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'next-rate-limit'

export const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 unique IPs per interval
})

// For critical endpoints
export const strictLimiter = {
  '/api/admin/elevate': { max: 3, window: '15m' },
  '/api/projects/[id]/vote': { max: 10, window: '1h' },
  '/api/wallet/quick-donate': { max: 20, window: '1h' },
}
```

---

### 2. **PLAIN TEXT PASSWORD COMPARISON** ⚠️ CRITICAL
**Location**: `src/app/api/admin/elevate/route.ts:38`

**Current Code**:
```typescript
if (password !== adminPassword) {
  return NextResponse.json({ error: 'Invalid admin password' }, { status: 403 })
}
```

**Risk**: Timing attacks can reveal password length and characters

**Solution**: Use constant-time comparison
```bash
npm install crypto-js
```

```typescript
import { createHash, timingSafeEqual } from 'crypto'

// Hash both passwords and compare
const hash = (str: string) => createHash('sha256').update(str).digest()
const passwordHash = hash(password)
const adminHash = hash(adminPassword)

if (!timingSafeEqual(passwordHash, adminHash)) {
  // Wait random time between 100-300ms to prevent timing attacks
  await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))
  return NextResponse.json({ error: 'Invalid admin password' }, { status: 403 })
}
```

---

### 3. **NO INPUT SANITIZATION** ⚠️ CRITICAL
**Risk**: XSS attacks, NoSQL injection, data corruption

**Affected Areas**:
- Project submissions
- User profile updates  
- Admin project edits
- Donation comments

**Solution**: Install and use DOMPurify + validator
```bash
npm install isomorphic-dompurify validator
```

**Implementation**:
```typescript
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
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
      ALLOWED_ATTR: ['href', 'target']
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
    zipcode: validator.isPostalCode(data.zipcode, 'US') ? data.zipcode : null,
    city: sanitizeInput(data.city, { maxLength: 100 }),
    state: sanitizeInput(data.state, { maxLength: 2 }),
  }
}
```

---

## 🔴 HIGH PRIORITY ISSUES

### 4. **Missing CSRF Protection**
**Risk**: Cross-site request forgery attacks

**Solution**: Next.js + NextAuth doesn't have built-in CSRF for API routes

```typescript
// src/lib/csrf.ts
import { createHash, randomBytes } from 'crypto'

export function generateCSRFToken(sessionId: string): string {
  const secret = process.env.CSRF_SECRET || 'change-me-in-production'
  const token = randomBytes(32).toString('hex')
  return createHash('sha256').update(`${token}:${sessionId}:${secret}`).digest('hex')
}

export function verifyCSRFToken(token: string, sessionId: string): boolean {
  const secret = process.env.CSRF_SECRET || 'change-me-in-production'
  const expected = createHash('sha256').update(`${token}:${sessionId}:${secret}`).digest('hex')
  return token === expected
}
```

Add to sensitive forms:
```typescript
// In component
const [csrfToken, setCSRFToken] = useState<string>('')

useEffect(() => {
  fetch('/api/csrf-token').then(r => r.json()).then(d => setCSRFToken(d.token))
}, [])

// In form submission
body: JSON.stringify({ ...data, _csrf: csrfToken })
```

---

### 5. **Weak Session Management**
**Location**: JWT tokens don't expire aggressively enough

**Current**: Default NextAuth session
**Risk**: Stolen tokens remain valid too long

**Solution**: Update `src/lib/auth.ts`
```typescript
session: {
  strategy: 'jwt',
  maxAge: 30 * 60, // 30 minutes (currently likely 30 days)
  updateAge: 5 * 60, // Update every 5 minutes
},
jwt: {
  maxAge: 30 * 60, // 30 minutes
},
```

---

### 6. **No Request Body Size Limits**
**Risk**: DoS attacks via large payloads

**Solution**: Add to `next.config.mjs`
```javascript
async rewrites() {
  return {
    beforeFiles: [
      {
        source: '/api/:path*',
        has: [
          {
            type: 'header',
            key: 'content-length',
            value: '(?<size>\\d+)',
          },
        ],
        destination: '/api/:path*',
      },
    ],
  }
},
// Add body size limit middleware
api: {
  bodyParser: {
    sizeLimit: '1mb', // Default is 1mb but be explicit
  },
},
```

---

### 7. **Missing Security Headers**
**Current**: Some headers in `next.config.mjs` but incomplete

**Add to headers()**:
```javascript
{
  key: 'X-DNS-Prefetch-Control',
  value: 'on'
},
{
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload'
},
{
  key: 'X-XSS-Protection',
  value: '1; mode=block'
},
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=()'
},
{
  key: 'Content-Security-Policy',
  value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' *.stripe.com; frame-src 'self' *.stripe.com;"
},
```

---

### 8. **Exposed Environment Variable Checks**
**Locations**: Multiple API files check for env vars and return specific errors

**Risk**: Reveals configuration details to attackers

**Example**: `src/app/api/admin/elevate/route.ts:32`
```typescript
if (!adminPassword) {
  return NextResponse.json({ 
    error: 'Admin elevation not configured. Contact system administrator.' 
  }, { status: 500 })
}
```

**Solution**: Generic error messages
```typescript
if (!adminPassword) {
  return NextResponse.json({ 
    error: 'Service temporarily unavailable' 
  }, { status: 503 })
}
```

---

### 9. **MongoDB Injection Possible**
**Risk**: NoSQL injection in query parameters

**Affected**: All MongoDB queries with user input

**Solution**: Strict type validation
```typescript
// src/lib/mongoSafe.ts
import { Types } from 'mongoose'

export function safeObjectId(id: string): Types.ObjectId | null {
  if (!id || typeof id !== 'string') return null
  return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null
}

export function safeQuery(query: any): any {
  // Prevent $where, $regex, etc in user input
  const sanitized = {}
  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('$')) continue // Block MongoDB operators
    sanitized[key] = value
  }
  return sanitized
}
```

**Usage**:
```typescript
const projectId = safeObjectId(params.id)
if (!projectId) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

const project = await Project.findById(projectId)
```

---

### 10. **No Audit Logging**
**Risk**: Can't track security incidents or admin actions

**Solution**: Create audit log system
```typescript
// src/models/AuditLog.ts
import mongoose, { Schema } from 'mongoose'

interface IAuditLog {
  userId: mongoose.Types.ObjectId
  action: string
  resourceType: 'project' | 'user' | 'wallet' | 'admin'
  resourceId: mongoose.Types.ObjectId
  changes: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
}

const AuditLogSchema = new Schema<IAuditLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, index: true },
  resourceType: { type: String, required: true, index: true },
  resourceId: { type: Schema.Types.ObjectId, required: true },
  changes: { type: Schema.Types.Mixed },
  ipAddress: { type: String, required: true },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
})

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
```

**Helper**:
```typescript
// src/lib/audit.ts
import AuditLog from '@/models/AuditLog'

export async function logAuditEvent({
  userId,
  action,
  resourceType,
  resourceId,
  changes,
  req
}: {
  userId: string
  action: string
  resourceType: string
  resourceId: string
  changes?: any
  req: NextRequest
}) {
  const ipAddress = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
  const userAgent = req.headers.get('user-agent') || 'unknown'
  
  await AuditLog.create({
    userId,
    action,
    resourceType,
    resourceId,
    changes,
    ipAddress,
    userAgent
  })
}
```

---

### 11. **Weak Password Policy** 
**Current**: Admin password has no enforced complexity

**Solution**: Add password validation
```typescript
// src/lib/password.ts
export function validatePasswordStrength(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
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
```

---

## ⚠️ MEDIUM PRIORITY ISSUES

### 12. **No Email Verification Enforcement**
**Risk**: Fake accounts, spam

**Solution**: Block actions until email verified
```typescript
// In API routes
if (!user.emailVerified) {
  return NextResponse.json({ 
    error: 'Please verify your email before performing this action',
    code: 'EMAIL_NOT_VERIFIED'
  }, { status: 403 })
}
```

---

### 13. **Stripe Webhook Secret Not Validated Properly**
**Location**: `src/app/api/stripe/webhook/route.ts`

**Current**: Checks signature but could be more robust

**Improvement**:
```typescript
if (!sig || !WEBHOOK_SECRET) {
  // Log potential attack attempt
  await logSecurityEvent('webhook_attack_attempt', req)
  return new NextResponse('Missing signature or webhook secret', { status: 400 })
}
```

---

### 14. **No File Upload Validation**
**Risk**: Malicious file uploads (if you add file upload feature)

**Prevention** (for future):
```typescript
// src/lib/fileUpload.ts
import { writeFile } from 'fs/promises'
import path from 'path'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' }
  }
  
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'File too large (max 5MB)' }
  }
  
  // Check file extension matches mime type
  const ext = path.extname(file.name).toLowerCase()
  const expectedExts = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  }
  
  if (!expectedExts[file.type]?.includes(ext)) {
    return { valid: false, error: 'File extension mismatch' }
  }
  
  return { valid: true }
}
```

---

### 15. **Insufficient Input Validation**
**Examples**:
- Zipcode: No format validation beyond length
- Email: Relies on validator but no domain blacklist
- Amount: No maximum limits on donations

**Solutions**:
```typescript
// src/lib/validation.ts
import validator from 'validator'

export function validateZipcode(zip: string): boolean {
  return /^\d{5}$/.test(zip) && parseInt(zip) >= 501 && parseInt(zip) <= 99950
}

export function validateEmail(email: string): boolean {
  if (!validator.isEmail(email)) return false
  
  const blacklistedDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com']
  const domain = email.split('@')[1]?.toLowerCase()
  
  return !blacklistedDomains.includes(domain)
}

export function validateDonationAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < 1) {
    return { valid: false, error: 'Minimum donation is $1' }
  }
  
  if (amount > 100000) {
    return { valid: false, error: 'Maximum donation is $100,000. Contact us for larger donations.' }
  }
  
  return { valid: true }
}
```

---

### 16-23. Additional Medium Priority Items
- **Implement 2FA for admin accounts**
- **Add IP whitelisting for admin actions**
- **Implement session invalidation on password change**
- **Add honeypot fields to forms (anti-bot)**
- **Implement captcha for sensitive actions**
- **Add database backup encryption**
- **Implement API versioning**
- **Add webhook retry logic with exponential backoff**

---

## 🎨 UI/UX IMPROVEMENTS

### 24. **Loading States Missing**
**Affected Components**:
- `AdminElevation.tsx` - Shows "Verifying..." but no spinner
- `ProjectManagement.tsx` - Generic loading text
- Wallet operations

**Solution**: Consistent loading component
```typescript
// src/components/ui/LoadingButton.tsx
export function LoadingButton({ 
  loading, 
  children, 
  ...props 
}: ButtonProps & { loading?: boolean }) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}
```

---

### 25. **Error Messages Too Generic**
**Current**: "Failed to process request", "An error occurred"

**Improvement**: Specific, actionable errors
```typescript
// src/lib/errors.ts
export const ErrorMessages = {
  INSUFFICIENT_FUNDS: {
    title: 'Insufficient Wallet Balance',
    message: 'Your wallet balance is too low for this donation. Please add funds or choose a different amount.',
    action: 'Add Funds'
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired for security. Please sign in again.',
    action: 'Sign In'
  },
  SUBSCRIPTION_REQUIRED: {
    title: 'Membership Required',
    message: 'This feature requires an active monthly membership. Upgrade now to unlock voting and project submission.',
    action: 'View Plans'
  }
}
```

---

### 26. **No Form Validation Feedback**
**Issue**: Users don't know why submission failed

**Solution**: Real-time validation with React Hook Form + Zod
```typescript
// Already have zod installed!
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const projectSchema = z.object({
  title: z.string()
    .min(10, 'Title must be at least 10 characters')
    .max(200, 'Title must be less than 200 characters'),
  zipcode: z.string()
    .regex(/^\d{5}$/, 'Must be a valid 5-digit ZIP code'),
  fundingGoal: z.number()
    .min(100, 'Minimum funding goal is $100')
    .max(1000000, 'Maximum funding goal is $1,000,000'),
})

// In component
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(projectSchema)
})
```

---

### 27. **Accessibility Issues**
**Missing**:
- Proper ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader announcements

**Solution**: Add accessibility attributes
```typescript
// Example for AdminElevation
<button
  onClick={handleElevateToAdmin}
  disabled={loading || !password.trim()}
  className="..."
  aria-label="Grant admin access"
  aria-busy={loading}
  aria-disabled={loading || !password.trim()}
>
  {loading ? (
    <>
      <span className="sr-only">Verifying password...</span>
      <LoadingSpinner />
    </>
  ) : (
    'Grant Admin Access'
  )}
</button>
```

---

### 28. **No Confirmation Dialogs**
**Issue**: Destructive actions (delete project) use browser `confirm()`

**Solution**: Custom modal component
```typescript
// src/components/ui/ConfirmDialog.tsx
export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger'
}: ConfirmDialogProps) {
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-md shadow-xl">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border rounded-xl hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white ${
              variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

### 29. **Mobile Responsiveness**
**Issues**:
- Admin table scrolls awkwardly on mobile
- Forms have no mobile optimization
- Buttons too small for touch targets

**Solutions**:
```typescript
// Minimum touch target: 44x44px
className="min-h-[44px] min-w-[44px]"

// Mobile-first table
<div className="overflow-x-auto -mx-4 sm:mx-0">
  <div className="inline-block min-w-full align-middle">
    <table className="min-w-full">
      {/* Mobile: card view, Desktop: table */}
      <tbody className="divide-y divide-gray-200">
        {projects.map(project => (
          <tr key={project.id} className="block sm:table-row">
            <td className="block sm:table-cell px-4 py-3">
              <span className="inline-block sm:hidden font-medium">Title:</span>
              {project.title}
            </td>
            {/* ... */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

---

### 30. **No Toast Notifications**
**Current**: Uses `alert()` for success messages

**Solution**: Use existing `react-hot-toast`
```typescript
// In components
import toast from 'react-hot-toast'

// Success
toast.success('Admin role granted successfully!', {
  duration: 4000,
  position: 'top-center',
  icon: '✅',
})

// Error
toast.error('Failed to update project', {
  duration: 5000,
  position: 'top-center',
})

// Loading
const toastId = toast.loading('Processing donation...')
// Later
toast.success('Donation successful!', { id: toastId })
```

---

### 31-38. Additional UI Improvements
- **Add skeleton loaders instead of "Loading..."**
- **Implement optimistic UI updates**
- **Add empty states with illustrations**
- **Improve color contrast for accessibility (WCAG AA)**
- **Add dark mode support**
- **Implement undo functionality for destructive actions**
- **Add progress indicators for multi-step processes**
- **Implement virtual scrolling for long lists**

---

## 🛠️ IMPLEMENTATION PRIORITY

### **Week 1** (Critical Security)
1. Rate limiting
2. Input sanitization
3. Password comparison fix
4. Security headers

### **Week 2** (High Security)
5. CSRF protection
6. Session management
7. MongoDB injection prevention
8. Audit logging

### **Week 3** (UI/UX)
9. Form validation with Zod
10. Loading states
11. Error messages
12. Toast notifications

### **Week 4** (Polish)
13. Accessibility
14. Mobile responsiveness
15. Confirmation dialogs
16. Documentation

---

## 📦 DEPENDENCIES TO ADD

```bash
# Security
npm install express-rate-limit next-rate-limit
npm install isomorphic-dompurify validator
npm install crypto-js

# Already have (confirm versions):
# - zod (4.1.11) ✅
# - react-hook-form (7.63.0) ✅  
# - @hookform/resolvers (5.2.2) ✅
# - react-hot-toast (2.6.0) ✅
```

---

## 📝 ENVIRONMENT VARIABLES TO ADD

```bash
# .env.local
CSRF_SECRET=your-random-32-character-string-here
RATE_LIMIT_WINDOW=900000 # 15 minutes in ms
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your-nextauth-secret-already-exists

# Update existing
ADMIN_ELEVATION_PASSWORD=YourStr0ng3rP@ssw0rd123!@#$%
```

---

## ✅ QUICK WINS (Implement First)

1. **Add rate limiting to admin elevate** (30 min)
2. **Fix password comparison** (15 min)
3. **Add security headers** (10 min)
4. **Replace alert() with toast** (20 min)
5. **Add loading spinners** (30 min)
6. **Add Zod validation to forms** (1 hour)
7. **MongoDB query sanitization** (45 min)
8. **Add CSRF tokens** (1 hour)

**Total Quick Wins Time**: ~5 hours
**Impact**: Eliminates 3 critical and 4 high-priority issues

---

## 🎯 SUCCESS METRICS

### Security
- [ ] 0 critical vulnerabilities
- [ ] All sensitive actions rate-limited
- [ ] 100% input sanitization coverage
- [ ] Audit logs for all admin actions

### UX
- [ ] < 2 second load times
- [ ] 90+ Lighthouse accessibility score
- [ ] Mobile-friendly (responsive)
- [ ] Clear error messages

---

## 📚 ADDITIONAL RESOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Stripe Security](https://stripe.com/docs/security/guide)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Review Completed**: October 6, 2025
**Next Review**: December 6, 2025 (Quarterly)
