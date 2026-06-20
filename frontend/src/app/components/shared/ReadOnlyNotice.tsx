import { Lock } from 'lucide-react';

type ReadOnlyNoticeProps = {
  message?: string;
};

export function ReadOnlyNotice({ message = 'O seu perfil esta em modo leitura neste modulo. Pode consultar dados, mas nao pode criar, editar ou eliminar.' }: ReadOnlyNoticeProps) {
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 mt-0.5" />
        <p className="text-amber-800 dark:text-amber-300" style={{ fontSize: '13px' }}>
          {message}
        </p>
      </div>
    </div>
  );
}
