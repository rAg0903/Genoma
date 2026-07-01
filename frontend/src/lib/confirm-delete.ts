/** Formata o alvo da eliminação para mensagens i18n. Ex.: deleteTargetLabel('Ana Silva', 'o contacto') */
export function deleteTargetLabel(entity: string, name: string): string {
  return `${entity} «${name}»`;
}
