import mongoose, { Schema, Document, Types } from 'mongoose'

export type ProjectStatus = 'draft' | 'voting' | 'funding' | 'build' | 'completed' | 'archived'

export interface IProject extends Document {
  org?: Types.ObjectId | null
  title: string
  slug?: string | null
  category?: string | null
  zipcode?: string | null
  shortDescription?: string | null
  description?: string | null
  coverImage?: string | null
  status: ProjectStatus
  voteGoal?: number
  votesYes?: number
  votesNo?: number
  fundingGoal?: number    // cents
  totalRaised?: number    // cents
  buildStartedAt?: Date | null
  completedAt?: Date | null
  grandOpeningAt?: Date | null
  adminVerifiedComplete?: boolean
  createdBy?: Types.ObjectId | null
}

const ProjectSchema = new Schema<IProject>(
  {
    org: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, default: null, lowercase: true, trim: true },
    category: { type: String, default: null, trim: true, index: true },
    zipcode: { type: String, default: null, index: true },
    shortDescription: { type: String, default: null },
    description: { type: String, default: null },
    coverImage: { type: String, default: null },
    status: { type: String, enum: ['draft','voting','funding','build','completed','archived'], default: 'draft', index: true },
    voteGoal: { type: Number, default: 0, min: 0 },
    votesYes: { type: Number, default: 0, min: 0 },
    votesNo: { type: Number, default: 0, min: 0 },
    fundingGoal: { type: Number, default: 0, min: 0 },
    totalRaised: { type: Number, default: 0, min: 0 },
    buildStartedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    grandOpeningAt: { type: Date, default: null },
    adminVerifiedComplete: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

// Useful uniqueness & filters
ProjectSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } })
ProjectSchema.index({ zipcode: 1, status: 1 })

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)
