import { ShieldX } from 'lucide-react';

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
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <ShieldX className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-gray-900 dark:text-gray-100" style={{ fontSize: '20px', fontWeight: 600 }}>{title}</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '14px' }}>
          {message}
        </p>
      </div>
    </div>
  );
}
