import mongoose, { Schema } from 'mongoose';

import type { IEmailTemplateDocument } from '@modules/emailTemplates/dtos/EmailTemplateDTO';
import { EFlagEmail } from '@modules/emailTemplates/EFlagEmail';

const emailTemplateMongooseSchema = new Schema<IEmailTemplateDocument>(
  {
    flag: { type: String, enum: Object.values(EFlagEmail), required: true, unique: true },
    titulo: { type: String, required: true },
    // Mixed porque é o JSON do editor do front, que o backend não interpreta.
    structure: { type: Schema.Types.Mixed, required: true },
    htmlRenderizado: { type: String, required: true },
    assunto: { type: String, required: true },
    anexos: { type: [String], default: [] },
    imagensInline: { type: [String], default: [] },
    destinatariosFixos: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: null },
    updatedBy: { type: String, default: null },
  },
  { timestamps: true, collection: 'email_templates' },
);

export const EmailTemplate = mongoose.model<IEmailTemplateDocument>('EmailTemplate', emailTemplateMongooseSchema);
