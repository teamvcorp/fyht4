import mongoose, {
  Schema,
  Types,
  InferSchemaType,
  HydratedDocument,
  Model,
} from 'mongoose'

export type UserRole = 'user' | 'admin'

const UserSchema = new Schema(
  {
    name: { type: String },
    email: { type: String, lowercase: true, trim: true }, // no unique index (NextAuth adapter owns it)
    image: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
    zipcode: { type: String, default: null, index: true },
  },
  { timestamps: true, collection: 'users' }
)

type SchemaUser = InferSchemaType<typeof UserSchema>
export interface IUser extends SchemaUser {
  _id: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}
export type UserDoc = HydratedDocument<IUser>

const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) || mongoose.model<IUser>('User', UserSchema)

export default User
