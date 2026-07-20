import { ShieldX } from 'lucide-react';
import { SURFACE } from '../../../lib/design-tokens';

type AccessDeniedStateProps = {
  title?: string;
  message?: string;
};

export function AccessDeniedState({
  title = 'Acesso negado',
  message = 'O perfil atual nao tem permissao para aceder a esta area.'
}: AccessDeniedStateProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className={`w-full max-w-lg ${SURFACE.cardElevated} p-8 text-center`}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20">
          <ShieldX className="h-6 w-6 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-slate-900 dark:text-slate-100" style={{ fontSize: '20px', fontWeight: 600 }}>{title}</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400" style={{ fontSize: '14px' }}>
          {message}
        </p>
      </div>
    </div>
  );
}
