// src/models/User.ts
import mongoose, { Schema, type Document, type Model } from 'mongoose'

/** --- Small literal enums (keeps TS happy) --- */
export const SUB_STATUSES = [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete',
  'incomplete_expired',
  'unpaid',
] as const
export type SubStatus = typeof SUB_STATUSES[number]

export const INTERVALS = ['day', 'week', 'month', 'year'] as const
export type Interval = typeof INTERVALS[number] | null

/** --- Nested subscription snapshot --- */
export interface IActiveSubscription {
  id: string
  status: SubStatus
  interval: Interval
  amount: number | null // cents
  currency: string | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  customerId: string
  priceId: string | null
  productId: string | null
}

/** --- User document --- */
export interface IUser extends Document {
  name?: string | null
  email?: string | null
  emailVerified?: Date | null
  image?: string | null

  role: 'user' | 'admin'
  zipcode?: string | null

  stripeCustomerId?: string | null
  activeSubscription?: IActiveSubscription | null
  lastPaidAt?: Date | null

  createdAt?: Date
  updatedAt?: Date
}

/**
 * IMPORTANT: don’t pass a generic to the subdocument schema.
 * That’s what triggers the “union type too complex to represent” error.
 */
const ActiveSubscriptionSchema = new Schema(
  {
    id: { type: String, required: true },
    status: { type: String, enum: SUB_STATUSES, required: true },
    interval: { type: String, enum: INTERVALS, default: null }, // allow null; not required
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    customerId: { type: String, required: true, index: true },
    priceId: { type: String, default: null },
    productId: { type: String, default: null },
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true, index: true },
    emailVerified: { type: Date, default: null },
    image: { type: String, default: null },

    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    zipcode: { type: String, default: null },

    stripeCustomerId: { type: String, index: true, sparse: true },
    activeSubscription: { type: ActiveSubscriptionSchema, default: null },
    lastPaidAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Optional: normalize emails to lowercase
UserSchema.pre('save', function (next) {
  if (this.email) this.email = this.email.toLowerCase()
  next()
})

const UserModel: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema)

export default UserModel
export type { IUser as UserDocument, IActiveSubscription }
