const normalizeContactos = (items) => {
  const list = Array.isArray(items) ? [...items] : [];
  while (list.length < 3) {
    list.push({ nome: '', funcao: '', email: '', telefone: '' });
  }
  return list.slice(0, 3).map((c) => ({
    nome: String(c?.nome || '').trim(),
    funcao: String(c?.funcao || '').trim(),
    email: String(c?.email || '').trim(),
    telefone: String(c?.telefone || '').trim(),
  }));
};

const normalizeCondicoesTestes = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .filter((r) => r && r.teste_id)
    .map((r) => ({
      teste_id: r.teste_id,
      comissao: r.comissao,
      prazo_pagamento_dias: r.prazo_pagamento_dias,
    }));
};

const attachLocalExtras = async (rows, kind, mapRow, localContactosRepository, localCondicoesRepository) => {
  const ids = rows.map((row) => row.id);
  const [contactosMap, condicoesMap] = await Promise.all([
    localContactosRepository.findContactosMap(kind, ids),
    localCondicoesRepository.findCondicoesMap(kind, ids),
  ]);
  return rows.map((row) => ({
    ...mapRow(row),
    contactos_secundarios: contactosMap.get(row.id) || [],
    condicoes_testes: condicoesMap.get(row.id) || [],
  }));
};

module.exports = {
  normalizeContactos,
  normalizeCondicoesTestes,
  attachLocalExtras,
};
