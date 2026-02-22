/**
 * Entidade User
 * Modelo de negócio puro - não tem dependência de framework
 */
export class User {
  public id!: string;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public createdAt!: Date;
  public updatedAt!: Date;

  // Métodos de negócio (se necessário)
  public isEmailValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }
}
