import type { NavigateFunction } from 'react-router';

/** Estado de navegação quando um contacto convertido redirecciona para o processo. */
export type ContactToProcessoRedirectState = {
  redirectedFromContact: true;
};

export const isContactToProcessoRedirect = (
  state: unknown,
): state is ContactToProcessoRedirectState =>
  typeof state === 'object' &&
  state !== null &&
  (state as ContactToProcessoRedirectState).redirectedFromContact === true;

/** Abre a ficha de processo (consulta) após pesquisa ou acesso a contacto convertido. */
export function navigateToProcessoFromContact(
  navigate: NavigateFunction,
  processoId: string,
  options?: { replace?: boolean },
) {
  navigate(`/processos/${processoId}`, {
    replace: options?.replace,
    state: { redirectedFromContact: true } satisfies ContactToProcessoRedirectState,
  });
}
