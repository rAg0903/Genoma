import type { UserRole } from './permissions';

type HasPermission = (module: 'processos', action: 'create' | 'update' | 'read' | 'delete') => boolean;

/** Médico: criar contacto/processo e consultar; sem alterações operacionais. */
export const canManageProcessoOperacional = (role: UserRole, hasPermission: HasPermission): boolean =>
  role !== 'Medico' && hasPermission('processos', 'update');

export const canCreateProcesso = (hasPermission: HasPermission): boolean =>
  hasPermission('processos', 'create');
