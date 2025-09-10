import mongoose, {
  Schema,
  Types,
  InferSchemaType,
  HydratedDocument,
  Model,
} from 'mongoose'

const WatchlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'watchlist' }
)

WatchlistSchema.index({ userId: 1, projectId: 1 }, { unique: true })

type SchemaWatch = InferSchemaType<typeof WatchlistSchema>
export interface IWatchlist extends SchemaWatch {
  _id: Types.ObjectId
  createdAt: Date
}
export type WatchlistDoc = HydratedDocument<IWatchlist>

const Watchlist: Model<IWatchlist> =
  (mongoose.models.Watchlist as Model<IWatchlist>) ||
  mongoose.model<IWatchlist>('Watchlist', WatchlistSchema)

export default Watchlist

export interface IWatchlistWithProject extends Omit<IWatchlist, 'projectId'> {
  projectId: import('./Project').IProject
}
