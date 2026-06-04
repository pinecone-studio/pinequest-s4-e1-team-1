import { Schema, model, Document, Types } from 'mongoose';

export interface ITaskDoc extends Document {
  uid: string;
  title: string;
  due: string;
  status: 'pending' | 'done';
  entryId: Types.ObjectId;
}

const TaskSchema = new Schema<ITaskDoc>({
  uid: { type: String, required: true, index: true },
  title: { type: String, required: true },
  due: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  entryId: { type: Schema.Types.ObjectId, ref: 'Entry', required: true },
});

export default model<ITaskDoc>('Task', TaskSchema);
