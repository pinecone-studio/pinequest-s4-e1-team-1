import { Schema, model, Document } from 'mongoose';

export interface INotificationDoc extends Document {
  uid: string;
  type: 'friend_request' | 'task_shared';
  fromUsername: string;
  taskTitle?: string;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDoc>({
  uid:          { type: String, required: true, index: true },
  type:         { type: String, enum: ['friend_request', 'task_shared'], required: true },
  fromUsername: { type: String, required: true },
  taskTitle:    { type: String },
  read:         { type: Boolean, default: false },
}, { timestamps: true });

export default model<INotificationDoc>('Notification', NotificationSchema);
