import mongoose, { Schema } from 'mongoose';

import type { IArquivoDocument } from '@modules/arquivos/dtos/ArquivoDTO';

const arquivoMongooseSchema = new Schema<IArquivoDocument>(
  {
    nomeOriginal: { type: String, required: true },
    arquivo: { type: String, required: true },
    mimeType: { type: String, required: true },
    tamanhoBytes: { type: Number, required: true },
    hashSha256: { type: String, required: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true, collection: 'arquivos', id: false, toJSON: { virtuals: true } },
);

arquivoMongooseSchema.virtual('url').get(function (this: IArquivoDocument) {
  return `/api/arquivos/${String(this._id)}/arquivo`;
});

// Fecha a corrida entre dois envios simultâneos do mesmo arquivo pelo mesmo usuário.
arquivoMongooseSchema.index({ createdBy: 1, hashSha256: 1 }, { unique: true });

export const Arquivo = mongoose.model<IArquivoDocument>('Arquivo', arquivoMongooseSchema);
