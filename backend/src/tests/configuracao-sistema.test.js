const configuracaoSistemaService = require('../services/configuracao-sistema.service');

describe('configuracao-sistema.service', () => {
  afterEach(() => {
    configuracaoSistemaService.invalidateCache();
  });

  test('save rejeita nome vazio', async () => {
    await expect(
      configuracaoSistemaService.save({ clinica_nome: '   ' }, { id: 'user-1' }),
    ).rejects.toThrow(/nome da clínica/i);
  });

  test('save rejeita email inválido', async () => {
    await expect(
      configuracaoSistemaService.save(
        { clinica_nome: 'GENOMA', clinica_email: 'invalido' },
        { id: 'user-1' },
      ),
    ).rejects.toThrow(/email/i);
  });
});
