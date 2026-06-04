import { Schema, model, Document } from 'mongoose';

export interface ITask {
  title: string;
  due: string;
}

export interface IEvent {
  title: string;
  datetime: string;
}

export interface IEntry extends Document {
  uid: string;
  text: string;
  tasks: ITask[];
  events: IEvent[];
  summary: string;
  createdAt: Date;
}

const EntrySchema = new Schema<IEntry>(
  {
    uid: { type: String, required: true, index: true },
    text: { type: String, required: true },
    tasks: [{ title: String, due: String }],
    events: [{ title: String, datetime: String }],
    summary: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IEntry>('Entry', EntrySchema);
