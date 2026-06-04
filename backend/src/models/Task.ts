import { Schema, model, Document, Types } from 'mongoose';

export interface ITaskDoc extends Document {
  title: string;
  due: string;
  status: 'pending' | 'done';
  entryId: Types.ObjectId;
}

const TaskSchema = new Schema<ITaskDoc>({
  title: { type: String, required: true },
  due: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'done'], default: 'pending' },
  entryId: { type: Schema.Types.ObjectId, ref: 'Entry', required: true },
});

export default model<ITaskDoc>('Task', TaskSchema);
