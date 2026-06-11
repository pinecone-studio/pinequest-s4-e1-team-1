import { Schema, model, Document, Types } from 'mongoose';

export interface ITaskDoc extends Document {
  uid: string;
  title: string;
  due: string;
  status: 'pending' | 'done';
  priority: 'high' | 'medium' | 'low';
  category: string;
  entryId?: Types.ObjectId;
  sharedBy?: string;
}

const TaskSchema = new Schema<ITaskDoc>({
  uid: { type: String, required: true, index: true },
  title: { type: String, required: true },
  due: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  category: { type: String, default: '' },
  entryId: { type: Schema.Types.ObjectId, ref: 'Entry', required: false },
  sharedBy: { type: String, default: null },
});

export default model<ITaskDoc>('Task', TaskSchema);
