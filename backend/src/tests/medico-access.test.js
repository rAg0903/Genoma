const perfisRepository = require('../repositories/perfis.repository');
const processosRepository = require('../repositories/processos.repository');

jest.mock('../repositories/perfis.repository');
jest.mock('../repositories/processos.repository');

const {
  assertProcessoAccess,
  loadProcessoWithAccess,
  assertOperacionalWriteAllowed,
} = require('../utils/medico-access');

describe('assertProcessoAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('permite administrador sem empresa_id', async () => {
    perfisRepository.findById.mockResolvedValue({ id: 'p-admin', nome: 'Administrador' });
    await expect(assertProcessoAccess({ medico_id: 'm-2', empresa_id: 'e-1' }, { id: 'u-1', role: 'p-admin' }))
      .resolves.toBeUndefined();
  });

  it('bloqueia médico noutro processo', async () => {
    perfisRepository.findById.mockResolvedValue({ id: 'p-medico', nome: 'Medico' });
    await expect(
      assertProcessoAccess({ medico_id: 'm-2', empresa_id: 'e-1' }, { id: 'm-1', role: 'p-medico' }),
    ).rejects.toThrow('Sem permissao para aceder a este processo');
  });

  it('permite médico no seu processo', async () => {
    perfisRepository.findById.mockResolvedValue({ id: 'p-medico', nome: 'Medico' });
    await expect(
      assertProcessoAccess({ medico_id: 'm-1', empresa_id: 'e-1' }, { id: 'm-1', role: 'p-medico' }),
    ).resolves.toBeUndefined();
  });

  it('bloqueia utilizador de outra empresa', async () => {
    perfisRepository.findById.mockResolvedValue({ id: 'p-assistente', nome: 'Assistente' });
    await expect(
      assertProcessoAccess({ medico_id: 'm-1', empresa_id: 'e-2' }, { id: 'u-1', role: 'p-assistente', empresa_id: 'e-1' }),
    ).rejects.toThrow('Sem permissao para aceder a este processo');
  });
});

describe('loadProcessoWithAccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devolve processo quando acesso é válido', async () => {
    perfisRepository.findById.mockResolvedValue({ id: 'p-assistente', nome: 'Assistente' });
    processosRepository.findById.mockResolvedValue({ id: 'proc-1', medico_id: 'm-1', empresa_id: 'e-1' });

    const processo = await loadProcessoWithAccess('proc-1', { id: 'u-1', role: 'p-assistente', empresa_id: 'e-1' });
    expect(processo.id).toBe('proc-1');
  });
});

describe('assertOperacionalWriteAllowed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bloqueia médico em escrita operacional', async () => {
    perfisRepository.findById.mockResolvedValue({ id: 'p-medico', nome: 'Medico' });
    await expect(assertOperacionalWriteAllowed({ id: 'm-1', role: 'p-medico' }))
      .rejects.toThrow('Sem permissao: medicos apenas podem consultar processos.');
  });

  it('permite assistente', async () => {
    perfisRepository.findById.mockResolvedValue({ id: 'p-assistente', nome: 'Assistente' });
    await expect(assertOperacionalWriteAllowed({ id: 'u-1', role: 'p-assistente' }))
      .resolves.toBeUndefined();
  });
});
