export const normalizePerfilNome = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export const isAdminPerfilNome = (nome?: string | null): boolean =>
  normalizePerfilNome(nome ?? '') === 'administrador';

export const isMedicoPerfilNome = (nome?: string | null): boolean =>
  normalizePerfilNome(nome ?? '') === 'medico';
