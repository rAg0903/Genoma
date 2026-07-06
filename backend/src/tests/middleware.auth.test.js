/**
 * Testes unitários — auth.middleware
 * Verifica comportamento do middleware de autenticação JWT sem necessidade de DB.
 */

'use strict';

jest.mock('../repositories/utilizadores.repository');

const jwt = require('jsonwebtoken');
const utilizadoresRepository = require('../repositories/utilizadores.repository');

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;

const authMiddleware = require('../middleware/auth.middleware');

const mockReq = (headers = {}) => ({ headers });
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const mockNext = () => jest.fn();

describe('auth.middleware', () => {
  afterEach(() => jest.clearAllMocks());

  test('rejeita pedido sem header Authorization (401)', async () => {
    const req = mockReq({});
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejeita token malformado (401)', async () => {
    const req = mockReq({ authorization: 'Bearer invalid.token.here' });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('rejeita token válido mas utilizador inativo (401)', async () => {
    const token = jwt.sign({ id: 'user-uuid-1' }, SECRET, { expiresIn: '1h' });
    utilizadoresRepository.findById.mockResolvedValue({ id: 'user-uuid-1', ativo: false, perfil_id: 'p1', empresa_id: 'e1', nome: 'Teste', email: 't@t.com' });

    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('passa utilizador ativo para req.user e chama next()', async () => {
    const token = jwt.sign({ id: 'user-uuid-2' }, SECRET, { expiresIn: '1h' });
    utilizadoresRepository.findById.mockResolvedValue({
      id: 'user-uuid-2',
      ativo: true,
      perfil_id: 'perfil-1',
      empresa_id: 'empresa-1',
      nome: 'Admin',
      email: 'admin@genoma.pt',
    });

    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = mockNext();

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toMatchObject({ id: 'user-uuid-2', perfil_id: 'perfil-1' });
  });
});
