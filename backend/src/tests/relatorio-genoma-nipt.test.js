const { buildRelatorioClinicoGenomaNiptHtml } = require('../templates/relatorio-clinico-genoma-nipt');

describe('relatorio-clinico-genoma-nipt', () => {
  const processoBase = {
    id: 'proc-1',
    numero_processo: 'P-2026-0042',
    paciente_nome: 'Maria Silva',
    medico_nome: 'Dr. Costa',
    teste_nome: 'Maternity — Básico',
    sub_teste_nome: 'Básico',
    teste_cromossomas: '13,18,21',
    empresa_nome: 'Genoma',
    id_amostra: 'AM-001',
    data_envio_laboratorio: '2026-06-10',
    data_chegada_laboratorio: '2026-06-12',
    data_relatorio_laboratorio: '2026-06-20',
    data_validacao: '2026-06-21',
    resultado_tudo_ok: 1,
    sugerir_repeticao: 0,
    resultados_cromossomas: JSON.stringify({ 13: 'Negativo', 18: 'Negativo', 21: 'Negativo' }),
    fracao_fetal: '12.5',
  };

  test('gera HTML com secções principais do ResultadoFolha', () => {
    const html = buildRelatorioClinicoGenomaNiptHtml(processoBase, []);
    expect(html).toContain('Relatório de Resultados — Teste Pré-Natal Não Invasivo');
    expect(html).toContain('Maria Silva');
    expect(html).toContain('P-2026-0042');
    expect(html).toContain('Resultados negativos');
    expect(html).toContain('Resultados cromossómicos');
    expect(html).toContain('C13');
    expect(html).toContain('Fração fetal');
  });

  test('mostra conclusão de anomalia quando há positivo', () => {
    const html = buildRelatorioClinicoGenomaNiptHtml({
      ...processoBase,
      resultado_tudo_ok: 0,
      resultados_cromossomas: JSON.stringify({ 13: 'Negativo', 18: 'Positivo', 21: 'Negativo' }),
    }, [
      { cromossoma: '18', resultado_valor: 'Positivo', tipo_resultado: 'Cromossoma' },
    ]);
    expect(html).toContain('Resultados positivos ou suspeitos');
    expect(html).toContain('Positivo: C18');
    expect(html).toContain('class="positivo"');
  });

  test('mostra alerta de repetição', () => {
    const html = buildRelatorioClinicoGenomaNiptHtml({
      ...processoBase,
      sugerir_repeticao: 1,
      resultado_tudo_ok: 0,
    }, []);
    expect(html).toContain('Sugerida repetição de colheita');
    expect(html).toContain('genoma-resultado-conclusao alerta');
  });
});
