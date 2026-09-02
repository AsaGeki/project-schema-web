import mongoose, { Schema } from 'mongoose';

import type { ILogDocument } from '@modules/logs/dtos/LogDTO';

const logMongooseSchema = new Schema<ILogDocument>(
  {
    action: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    message: { type: String, required: true },
    targetId: { type: String, default: null, index: true },
    // Mixed porque o payload varia por evento — é o motivo de o log viver no Mongo.
    payload: { type: Schema.Types.Mixed, default: null },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true, collection: 'logs' },
);

export const Log = mongoose.model<ILogDocument>('Log', logMongooseSchema);
