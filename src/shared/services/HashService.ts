import bcrypt from 'bcryptjs';

/**
 * Service interno de hash — não atravessa a fronteira HTTP, então retorna o
 * valor puro em vez do envelope de resposta.
 */
export default class HashService {
  private readonly saltRounds = 10;

  public async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  public async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
