export function formatUtilizadorNome(user: { nome: string; medico_titulo?: string | null }) {
  return [user.medico_titulo, user.nome].filter(Boolean).join(' ');
}

/** Nome curto para saudações: "Dra. Ana" */
export function formatUtilizadorGreeting(user: { nome?: string | null; medico_titulo?: string | null }) {
  const first = user.nome?.trim().split(/\s+/)[0] ?? '';
  if (user.medico_titulo && first) return `${user.medico_titulo} ${first}`;
  return first || user.nome || '';
}
