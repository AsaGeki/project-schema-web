import mongoose, { Schema } from 'mongoose';

/** Um documento por sequência: `_id` é o nome dela, `seq` o último número emitido. */
export interface ICounterDTO {
  _id: string;
  seq: number;
}

const counterSchema = new Schema<ICounterDTO>(
  {
    _id: { type: String },
    seq: { type: Number, required: true, default: 0 },
  },
  { versionKey: false },
);

const counterModel = mongoose.model<ICounterDTO>('Counter', counterSchema, 'Counters');

/**
 * Próximo número da sequência `chave`, começando em 1. `findOneAndUpdate` com
 * `$inc` sobre um documento só é atômico, então chamadas concorrentes recebem
 * números distintos — ler o maior e somar 1 não garante isso.
 */
export async function proximaSequencia(chave: string): Promise<number> {
  const counter = await counterModel.findOneAndUpdate(
    { _id: chave },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  );

  return counter.seq;
}

export default counterModel;
