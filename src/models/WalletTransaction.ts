import mongoose, { Schema, Document, Types } from 'mongoose'

export type TransactionType = 'credit' | 'debit'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export interface IWalletTransaction extends Document {
  userId: Types.ObjectId
  type: TransactionType
  amount: number // cents
  description: string
  status: TransactionStatus
  
  // Related data
  relatedProjectId?: Types.ObjectId | null
  stripeTransactionId?: string | null
  stripePaymentIntentId?: string | null
  
  // Balance tracking
  balanceBefore: number // cents
  balanceAfter: number // cents
  
  // Metadata
  metadata?: Record<string, any> // flexible data storage
  
  createdAt: Date
  updatedAt: Date
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['credit', 'debit'], required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending', index: true },
    
    relatedProjectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
    stripeTransactionId: { type: String, default: null, index: true },
    stripePaymentIntentId: { type: String, default: null, index: true },
    
    balanceBefore: { type: Number, required: true, min: 0 },
    balanceAfter: { type: Number, required: true, min: 0 },
    
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { 
    timestamps: true,
    collection: 'wallet_transactions'
  }
)

// Compound indexes for efficient queries
WalletTransactionSchema.index({ userId: 1, createdAt: -1 })
WalletTransactionSchema.index({ userId: 1, status: 1 })
WalletTransactionSchema.index({ relatedProjectId: 1, type: 1 })

// Use mongoose.model with proper error handling
let WalletTransaction: mongoose.Model<IWalletTransaction>

try {
  WalletTransaction = mongoose.model<IWalletTransaction>('WalletTransaction')
} catch (error) {
  WalletTransaction = mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema)
}

export default WalletTransaction

// Helper types for populated results
export interface IWalletTransactionWithProject extends Omit<IWalletTransaction, 'relatedProjectId'> {
  relatedProjectId: import('./Project').IProject | null
}

export interface IWalletTransactionWithUser extends Omit<IWalletTransaction, 'userId'> {
  userId: import('./User').IUser
}