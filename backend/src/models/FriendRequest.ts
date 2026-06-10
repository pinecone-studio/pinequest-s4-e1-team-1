import { Schema, model, Document } from 'mongoose';

export interface IFriendRequestDoc extends Document {
  fromUid: string;
  toUid:   string;
  status:  'pending' | 'accepted' | 'rejected';
}

const FriendRequestSchema = new Schema<IFriendRequestDoc>(
  {
    fromUid: { type: String, required: true, index: true },
    toUid:   { type: String, required: true, index: true },
    status:  { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

FriendRequestSchema.index({ fromUid: 1, toUid: 1 }, { unique: true });

export default model<IFriendRequestDoc>('FriendRequest', FriendRequestSchema);
