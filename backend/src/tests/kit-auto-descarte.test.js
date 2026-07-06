/**
 * Testes unitários — kit-auto-descarte.service
 * Valida a lógica de identificação e processamento de kits a descartar.
 * Todos os acessos à BD são interceptados por mocks de módulo.
 */

'use strict';

const mockConnection = {
  execute: jest.fn(),
  release: jest.fn(),
};

jest.mock('../config/database', () => ({
  getConnection: jest.fn().mockResolvedValue(mockConnection),
}));

jest.mock('../services/stocks.service', () => ({
  registerDescarteForKits: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../services/laboratorio-final.service', () => ({
  resolveLaboratorioFinalForKit: jest.fn().mockResolvedValue('lab-uuid-1'),
}));

const autoDescarte = require('../services/kit-auto-descarte.service');

describe('processPendingAutoDescartes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // markCalendarExpiredKits e findKitsPendingAutoDescarte usam pool.getConnection
    mockConnection.execute.mockResolvedValue([{ affectedRows: 0 }]);
  });

  test('retorna { shipments:0, kits:0, errors:[] } quando não há kits pendentes', async () => {
    // Primeiro execute = markCalendarExpiredKits (UPDATE); segundo = findKitsPending (SELECT)
    mockConnection.execute
      .mockResolvedValueOnce([{ affectedRows: 0 }])
      .mockResolvedValueOnce([[]]); // kits vazios

    const result = await autoDescarte.processPendingAutoDescartes();

    expect(result).toEqual({ shipments: 0, kits: 0, errors: [] });
  });

  test('processa um kit e regista um envio quando tudo está configurado', async () => {
    const kit = {
      id: 'kit-1',
      codigo_barras: 'SN001',
      status: 'Expirado',
      data_validade: '2024-01-01',
      localizacao: 'Posto',
      posto_id: 'posto-1',
      posto_nome: 'Posto Alfa',
      empresa_id: null,
      empresa_nome: null,
      fase_ciclo: null,
      data_colheita_mov: null,
    };

    mockConnection.execute
      .mockResolvedValueOnce([{ affectedRows: 1 }])   // markCalendarExpiredKits
      .mockResolvedValueOnce([[kit]])                   // findKitsPendingAutoDescarte
      .mockResolvedValueOnce([[{ nome: 'Lab Final' }]]); // lookup de laboratorio

    const { registerDescarteForKits } = require('../services/stocks.service');
    const result = await autoDescarte.processPendingAutoDescartes();

    expect(registerDescarteForKits).toHaveBeenCalledTimes(1);
    expect(result.shipments).toBe(1);
    expect(result.kits).toBe(1);
    expect(result.errors).toHaveLength(0);
  });
});
