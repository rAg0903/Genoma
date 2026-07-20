import { ReactNode } from 'react';
import { PermissionAction, PermissionModule } from '../../../lib/permissions';
import { useAuth } from '../../context/AuthContext';

type PermissionGuardProps = {
  module: PermissionModule;
  action: PermissionAction;
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGuard({ module, action, fallback = null, children }: PermissionGuardProps) {
  const { hasPermission } = useAuth();
  if (!hasPermission(module, action)) return <>{fallback}</>;
  return <>{children}</>;
}
