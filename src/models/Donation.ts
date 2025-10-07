import mongoose, { Schema, Document, Types } from 'mongoose'

export type DonationKind = 'one_time' | 'subscription'
export type DonationSource = 'stripe' | 'wallet'

export interface IDonation extends Document {
  userId?: Types.ObjectId | null
  projectId?: Types.ObjectId | null
  email?: string | null
  externalId: string
  source: DonationSource
  kind: DonationKind
  currency: string
  amount: number
  checkoutSessionId?: string | null
  subscriptionId?: string | null
  invoiceId?: string | null
  campaign?: string | null
  createdAt?: Date
  updatedAt?: Date
}

const DonationSchema = new Schema<IDonation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    email: { type: String, default: null, index: true },

    externalId: { type: String, required: true, unique: true, index: true }, // idempotency key
    source: { type: String, enum: ['stripe', 'wallet'], default: 'stripe' },
    kind: { type: String, enum: ['one_time', 'subscription'], required: true, index: true },
    currency: { type: String, required: true, lowercase: true },
    amount: { type: Number, required: true, min: 0 },

    checkoutSessionId: { type: String, default: null },
    subscriptionId: { type: String, default: null, index: true },
    invoiceId: { type: String, default: null, index: true },

    campaign: { type: String, default: null },
  },
  { timestamps: true, collection: 'donations' }
)

export default mongoose.models.Donation || mongoose.model<IDonation>('Donation', DonationSchema)

// Helpers for populated results:
export interface IDonationWithProject extends Omit<IDonation, 'projectId'> {
  projectId: import('./Project').IProject | null
}
