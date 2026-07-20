jest.mock('../services/configuracao-sistema.service', () => ({
  resolveClinica: jest.fn(async (processo = {}) => ({
    nome: processo.empresa_nome || 'GENOMA',
    morada: '',
    codigoPostal: '',
    telefone: '',
    email: '',
  })),
}));

const pdfService = require('../services/pdf.service');
const {
  buildTituloConclusao,
  buildTextoConclusao,
  inicializarNegativo,
} = require('../utils/cromossoma-opcoes');

describe('gerarRelatorioNiptPdf', () => {
  afterAll(async () => {
    await pdfService.closePdfBrowser();
  });

  test('gera buffer PDF não vazio', async () => {
    const processo = {
      numero_processo: 'P-2026-0099',
      paciente_nome: 'Ana Teste',
      medico_nome: 'Dr. Silva',
      teste_nome: 'Maternity — Básico',
      sub_teste_nome: 'Básico',
      teste_cromossomas: '13,18,21',
      resultado_tudo_ok: 1,
      sugerir_repeticao: 0,
      resultados_cromossomas: JSON.stringify(inicializarNegativo([13, 18, 21])),
      empresa_nome: 'Genoma',
    };

    const buf = await pdfService.gerarRelatorioNiptPdf({ processo, anomalias: [] });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(2000);
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
  });

  test('conclusão de anomalia no texto derivado', () => {
    const titulo = buildTituloConclusao({ sugerirRepeticao: false, semAnomalias: false });
    const texto = buildTextoConclusao({
      sugerirRepeticao: false,
      semAnomalias: false,
      resultados: { 21: 'Positivo', 13: 'Negativo', 18: 'Negativo' },
      analisados: [13, 18, 21],
    });
    expect(titulo).toContain('positivos ou suspeitos');
    expect(texto).toContain('C21');
  });
});
