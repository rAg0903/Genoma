import type { MotivoAnulacao } from '../app/data/types';

export type MotivoAnulacaoContexto = 'contacto' | 'processo';

export const MOTIVO_CONTEXTO_LABEL: Record<MotivoAnulacaoContexto, string> = {
  contacto: 'Contacto (antes da colheita)',
  processo: 'Processo (após colheita)',
};

export function filterMotivosPorContexto(
  motivos: MotivoAnulacao[],
  contexto: MotivoAnulacaoContexto,
): MotivoAnulacao[] {
  return motivos.filter((m) => m.ativo !== false && m.contexto === contexto);
}

/** Texto de ajuda ao cancelar processo consoante o motivo seleccionado. */
export function getMotivoProcessoCancelHint(motivo: MotivoAnulacao): string {
  if (motivo.reabre_contacto) {
    return 'Repõe o contacto para nova colheita, mantendo apenas a identificação (ex.: fração fetal insuficiente para análise).';
  }

  const nome = motivo.nome.toLowerCase();
  if (nome.includes('erro') && nome.includes('atribui')) {
    return 'Cancela o processo criado por engano (ex.: kit ou nº de processo incorrecto). O contacto mantém os dados clínicos para abrir um novo processo com o kit correcto.';
  }

  return 'O processo será cancelado. O contacto permanece disponível para continuar o fluxo.';
}
