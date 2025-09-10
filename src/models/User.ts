// src/models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface IActiveSubscription {
  id: string;                       // Stripe subscription id (sub_*)
  status:
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'unpaid'
    | 'paused';
  interval: 'month' | 'year' | null;
  amount: number | null;            // unit_amount in cents
  currency: string | null;          // lowercase (e.g. 'usd')
  currentPeriodEnd: Date | null;    // renewal boundary from Stripe
  cancelAtPeriodEnd: boolean;
  customerId: string;               // Stripe customer id (cus_*)
  priceId?: string | null;
  productId?: string | null;
}

export interface IUser extends Document {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  zipcode?: string | null;

  stripeCustomerId?: string | null;
  activeSubscription?: IActiveSubscription | null;
  lastPaidAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const ActiveSubscriptionSchema = new Schema<IActiveSubscription>(
  {
    id: { type: String, required: true },
    status: {
      type: String,
      enum: [
        'incomplete',
        'incomplete_expired',
        'trialing',
        'active',
        'past_due',
        'canceled',
        'unpaid',
        'paused',
      ],
      required: true,
    },
    interval: { type: String, enum: ['month', 'year', null], default: null },
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    customerId: { type: String, required: true },
    priceId: { type: String, default: null },
    productId: { type: String, default: null },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: String,
    email: { type: String, index: true }, // DO NOT set `unique` here to avoid duplicate-index warnings with NextAuth adapter
    image: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    zipcode: { type: String, default: null },

    stripeCustomerId: { type: String, default: undefined },
    activeSubscription: { type: ActiveSubscriptionSchema, default: null },
    lastPaidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Keep a unique sparse index only for customerId (users can be created without Stripe at first)
UserSchema.index({ stripeCustomerId: 1 }, { unique: true, partialFilterExpression: { stripeCustomerId: { $type: 'string' } }, });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
