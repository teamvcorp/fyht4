import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface IProjectVote extends Document {
  projectId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  zipcode: string
  value: 'yes' | 'no'
  createdAt: Date
}

const ProjectVoteSchema = new Schema<IProjectVote>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    zipcode: {
      type: String,
      required: true,
      index: true,
    },
    value: {
      type: String,
      enum: ['yes', 'no'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure one vote per user per project
ProjectVoteSchema.index({ projectId: 1, userId: 1 }, { unique: true })

// Index for finding user's votes
ProjectVoteSchema.index({ userId: 1, createdAt: -1 })

const ProjectVote: Model<IProjectVote> =
  (mongoose.models.ProjectVote as Model<IProjectVote>) ||
  mongoose.model<IProjectVote>('ProjectVote', ProjectVoteSchema)

export default ProjectVote