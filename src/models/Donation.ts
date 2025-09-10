import mongoose, {
  Schema,
  Types,
  InferSchemaType,
  HydratedDocument,
  Model,
} from 'mongoose'

export type DonationKind = 'one_time' | 'subscription'

const DonationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    email: { type: String, default: null, index: true },

    externalId: { type: String, required: true, unique: true, index: true }, // idempotency key
    source: { type: String, enum: ['stripe'], default: 'stripe' },
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

type SchemaDonation = InferSchemaType<typeof DonationSchema>
export interface IDonation extends SchemaDonation {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}
export type DonationDoc = HydratedDocument<IDonation>

const Donation: Model<IDonation> =
  (mongoose.models.Donation as Model<IDonation>) ||
  mongoose.model<IDonation>('Donation', DonationSchema)

export default Donation

// Helpers for populated results:
export interface IDonationWithProject extends Omit<IDonation, 'projectId'> {
  projectId: import('./Project').IProject | null
}
