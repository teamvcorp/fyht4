import mongoose, { Schema, Document, Types } from 'mongoose'

export type ProjectStatus = 'draft' | 'voting' | 'funding' | 'build' | 'completed' | 'archived'

export interface IProject extends Document {
  org?: Types.ObjectId | null
  title: string
  slug?: string | null
  category?: string | null
  zipcode?: string | null
  city?: string | null
  state?: string | null
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
  // Admin notification fields
  readyForBuildNotified?: boolean
  readyForCompletionNotified?: boolean
  // Helper methods
  acceptsVotes(): boolean
  acceptsDonations(): boolean
  isReadyForBuild(): boolean
  isReadyForCompletion(): boolean
}

const ProjectSchema = new Schema<IProject>(
  {
    org: { type: Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, default: null, lowercase: true, trim: true },
    category: { type: String, default: null, trim: true, index: true },
    zipcode: { type: String, default: null, index: true },
    city: { type: String, default: null, trim: true, index: true },
    state: { type: String, default: null, trim: true, index: true },
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
    // Admin notification tracking
    readyForBuildNotified: { type: Boolean, default: false },
    readyForCompletionNotified: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Useful uniqueness & filters
ProjectSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { slug: { $type: 'string' } } })
ProjectSchema.index({ zipcode: 1, status: 1 })
ProjectSchema.index({ state: 1, status: 1 })
ProjectSchema.index({ city: 1, status: 1 })

// Helper methods for project lifecycle
ProjectSchema.methods.acceptsVotes = function(): boolean {
  // Projects accept votes until they enter build phase
  return ['draft', 'voting', 'funding'].includes(this.status)
}

ProjectSchema.methods.acceptsDonations = function(): boolean {
  // Projects accept donations until they enter build phase
  return ['voting', 'funding'].includes(this.status)
}

ProjectSchema.methods.isReadyForBuild = function(): boolean {
  // Ready for build when both vote and funding goals are met
  const votesMet = this.voteGoal > 0 && this.votesYes >= this.voteGoal
  const fundingMet = this.fundingGoal > 0 && this.totalRaised >= this.fundingGoal
  return votesMet && fundingMet && ['voting', 'funding'].includes(this.status)
}

ProjectSchema.methods.isReadyForCompletion = function(): boolean {
  // Ready for completion when in build status and admin hasn't been notified yet
  return this.status === 'build' && this.buildStartedAt && !this.adminVerifiedComplete
}

export default mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema)
