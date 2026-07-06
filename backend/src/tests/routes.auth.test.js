/**
 * Testes de integração — /api/auth
 * Verifica que os endpoints de autenticação respondem correctamente.
 * Usa mocks para isolar o DB e serviços externos.
 */

'use strict';

jest.mock('../services/auth.service');
jest.mock('../repositories/utilizadores.repository');
jest.mock('../repositories/perfis.repository');
jest.mock('../services/notifications.service', () => ({ registerListeners: jest.fn() }));
jest.mock('../services/kit-auto-descarte.service', () => ({ scheduleAutoDescartes: jest.fn() }));
jest.mock('../config/database', () => ({
  getConnection: jest.fn().mockResolvedValue({
    execute: jest.fn().mockResolvedValue([[]]),
    release: jest.fn(),
  }),
}));

const request = require('supertest');
const app = require('../app');
const authService = require('../services/auth.service');

describe('POST /api/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  test('devolve 401 para credenciais inválidas', async () => {
    authService.login.mockRejectedValue(new Error('Credenciais inválidas'));

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inexistente@genoma.pt', password: 'errada' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  test('devolve token JWT em caso de sucesso', async () => {
    authService.login.mockResolvedValue('mocked.jwt.token');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@genoma.pt', password: 'senha123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token', 'mocked.jwt.token');
  });
});

describe('POST /api/auth/register', () => {
  test('rejeita pedido sem autenticação (401)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nome: 'Teste', email: 'novo@genoma.pt', password: 'senha123' });

    expect(res.status).toBe(401);
  });
});
