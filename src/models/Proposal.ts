import mongoose, { Schema, Types, Document } from 'mongoose'

export type ProposalStatus = 'pending' | 'approved' | 'rejected'

export interface IProposal extends Document {
  org?: Types.ObjectId | null            // optional owning org
  title: string
  category?: string | null
  zipcode: string
  shortDescription?: string | null
  description?: string | null
  fundingGoal: number                    // cents
  voteGoal: number
  createdBy: Types.ObjectId              // who submitted the proposal
  status: ProposalStatus
  adminNotes?: string | null
  createdAt: Date
  updatedAt: Date
}

const ProposalSchema = new Schema<IProposal>(
  {
    org:            { type: Schema.Types.ObjectId, ref: 'Organization', index: true, default: null },
    title:          { type: String, required: true, trim: true },
    category:       { type: String, trim: true, default: null },
    zipcode:        { type: String, required: true, trim: true, index: true },
    shortDescription:{ type: String, default: null },
    description:    { type: String, default: null },
    fundingGoal:    { type: Number, required: true, min: 0 },
    voteGoal:       { type: Number, required: true, min: 0 },
    createdBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status:         { type: String, enum: ['pending','approved','rejected'], default: 'pending', index: true },
    adminNotes:     { type: String, default: null },
  },
  { timestamps: true }
)

export default mongoose.models.Proposal ||
  mongoose.model<IProposal>('Proposal', ProposalSchema)
