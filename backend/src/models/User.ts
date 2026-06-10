import { Schema, model, Document } from 'mongoose';

export interface IUserDoc extends Document {
  uid: string;
  username: string;
}

const UserSchema = new Schema<IUserDoc>(
  {
    uid:      { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { timestamps: true }
);

export default model<IUserDoc>('User', UserSchema);
