/**
 * Testes unitários — authorization.middleware (requireAdmin)
 * Verifica que a protecção RBAC funciona correctamente sem DB real.
 */

'use strict';

jest.mock('../repositories/perfis.repository');
jest.mock('../services/perfil_stock_submodulos.service');

const perfisRepository = require('../repositories/perfis.repository');
const { requireAdmin } = require('../middleware/authorization.middleware');

const mockReq = (perfilId = null) => ({
  user: { role: perfilId, perfil_id: perfilId },
  params: {},
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireAdmin', () => {
  afterEach(() => jest.clearAllMocks());

  test('nega acesso quando perfil não é encontrado (403)', async () => {
    perfisRepository.findById.mockResolvedValue(null);
    const req = mockReq('perfil-inexistente');
    const res = mockRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('nega acesso a perfil não-administrador (403)', async () => {
    perfisRepository.findById.mockResolvedValue({ id: 'p1', nome: 'Enfermeiro' });
    const req = mockReq('p1');
    const res = mockRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('permite acesso a perfil Administrador', async () => {
    perfisRepository.findById.mockResolvedValue({ id: 'p-admin', nome: 'Administrador' });
    const req = mockReq('p-admin');
    const res = mockRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  test('nega acesso quando req.user está ausente (403)', async () => {
    perfisRepository.findById.mockResolvedValue(null);
    const req = { user: null, params: {} };
    const res = mockRes();
    const next = jest.fn();

    await requireAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});
