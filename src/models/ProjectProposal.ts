// src/models/ProjectProposal.ts
import mongoose, { Schema, Document, Types } from 'mongoose'

export type ProposalStatus = 'pending' | 'approved' | 'rejected'

export interface IProjectProposal extends Document {
  title: string
  category: string
  zipcode: string
  city?: string
  state?: string
  shortDescription: string
  description: string
  fundingGoal: number   // cents
  voteGoal: number
  createdBy: Types.ObjectId
  status: ProposalStatus
  adminNotes: string
  createdAt: Date
  updatedAt: Date
}

const ProjectProposalSchema = new Schema<IProjectProposal>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true },
    zipcode: { type: String, required: true, trim: true, index: true },
    city: { type: String, default: null, trim: true },
    state: { type: String, default: null, trim: true },
    shortDescription: { type: String, default: '' },
    description: { type: String, default: '' },
    fundingGoal: { type: Number, required: true, min: 100 }, // store cents; min $1
    voteGoal: { type: Number, required: true, min: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    adminNotes: { type: String, default: '' },
  },
  {
    timestamps: true,
    collection: 'project_proposals', // ✅ keep existing collection name
  }
)

export default (mongoose.models.ProjectProposal as mongoose.Model<IProjectProposal>) ||
  mongoose.model<IProjectProposal>('ProjectProposal', ProjectProposalSchema)
