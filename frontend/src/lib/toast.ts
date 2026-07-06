import { toast } from 'sonner';

export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyError(error: unknown, fallback = 'Operação falhou.') {
  const message = error instanceof Error ? error.message : fallback;
  toast.error(message);
}

export function notifyInfo(message: string) {
  toast.message(message);
}
