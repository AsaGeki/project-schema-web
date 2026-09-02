import bcrypt from 'bcryptjs';

import { authConfig } from '@configs/authConfig';

/**
 * Service interno de hash — não atravessa a fronteira HTTP, então retorna o
 * valor puro em vez do envelope de resposta.
 */
export default class HashService {
  private readonly saltRounds = authConfig.saltRounds;

  public async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  public async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
