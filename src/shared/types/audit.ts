/**
 * Campos de auditoria de autoria. `createdAt`/`updatedAt` são preenchidos pelo
 * banco; `createdBy`/`updatedBy` chegam do service, a partir do usuário
 * autenticado, e por isso entram no contrato de escrita do repositório.
 */
export interface IAuditFields {
  createdBy?: string | null;
  updatedBy?: string | null;
}
