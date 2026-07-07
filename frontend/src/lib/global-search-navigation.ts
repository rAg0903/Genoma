import type { NavigateFunction } from 'react-router';
import type { SearchResultItem } from './api-listagens';
import { navigateToProcessoFromContact } from './contact-processo-redirect';

/** Navegação partilhada a partir de resultados da pesquisa global. */
export function navigateToSearchTarget(
  navigate: NavigateFunction,
  target: SearchResultItem['target'],
) {
  if (target.listing === 'pacientes' && target.paciente_id) {
    if (target.processo_id) {
      navigateToProcessoFromContact(navigate, target.processo_id);
      return;
    }
    navigate(`/contactos/${target.paciente_id}`);
    return;
  }

  if (target.listing === 'medicos') {
    navigate(`/definicoes/medicos/${target.id}/editar`);
    return;
  }

  if (target.listing === 'processos' || target.listing === 'resultados') {
    navigate(`/processos/${target.id}`);
    return;
  }

  if (target.listing === 'kits' || target.listing === 'lotes') {
    navigate(`/listagens?tab=${target.listing}&q=${encodeURIComponent(target.id)}`);
    return;
  }

  const tab = target.listing === 'painel_bordo' ? 'painel_bordo' : target.listing;
  navigate(tab === 'painel_bordo' ? '/listagens' : `/listagens?tab=${tab}`);
}
