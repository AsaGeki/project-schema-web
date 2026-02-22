/**
 * DTO de resposta do usuário
 * Nunca expõe campos sensíveis como passwordHash
 */
export interface UserResponseDTO {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}
