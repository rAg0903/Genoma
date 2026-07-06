/**
 * Testes unitários — validators.js + validationMiddleware
 * Valida comportamento dos validadores express-validator sem DB.
 */

'use strict';

const express = require('express');
const request = require('supertest');
const { pacienteValidator, utilizadorValidator, empresaValidator } = require('../middleware/validators');
const { validationMiddleware } = require('../middleware/error.middleware');

const buildApp = (validators) => {
  const app = express();
  app.use(express.json());
  app.post('/test', validators, validationMiddleware, (req, res) => res.json({ ok: true }));
  return app;
};

describe('pacienteValidator', () => {
  const app = buildApp(pacienteValidator);

  test('rejeita payload sem nome (400)', async () => {
    const res = await request(app).post('/test').send({ data_nascimento: '1990-01-01' });
    expect(res.status).toBe(400);
    expect(res.body.errors.some((e) => e.field === 'nome')).toBe(true);
  });

  test('aceita payload com apenas nome (data_nascimento opcional)', async () => {
    const res = await request(app).post('/test').send({ nome: 'Maria Silva' });
    expect(res.status).toBe(200);
  });

  test('rejeita data_nascimento num formato inválido', async () => {
    const res = await request(app).post('/test').send({ nome: 'Maria', data_nascimento: '01-13-1990' });
    expect(res.status).toBe(400);
  });

  test('rejeita NIF com formato errado', async () => {
    const res = await request(app).post('/test').send({ nome: 'Maria', nif: '12345' });
    expect(res.status).toBe(400);
  });

  test('aceita género válido (M)', async () => {
    const res = await request(app).post('/test').send({ nome: 'João', genero: 'M' });
    expect(res.status).toBe(200);
  });

  test('rejeita género inválido', async () => {
    const res = await request(app).post('/test').send({ nome: 'João', genero: 'X' });
    expect(res.status).toBe(400);
  });
});

describe('utilizadorValidator', () => {
  const app = buildApp(utilizadorValidator);

  test('rejeita payload sem email (400)', async () => {
    const res = await request(app).post('/test').send({ nome: 'Admin', password: 'senha123' });
    expect(res.status).toBe(400);
  });

  test('rejeita email inválido', async () => {
    const res = await request(app).post('/test').send({ nome: 'Admin', email: 'nao-e-email', password: 'senha123' });
    expect(res.status).toBe(400);
  });

  test('rejeita password curta', async () => {
    const res = await request(app).post('/test').send({ nome: 'Admin', email: 'admin@genoma.pt', password: '123' });
    expect(res.status).toBe(400);
  });

  test('aceita payload válido', async () => {
    const res = await request(app).post('/test').send({ nome: 'Admin', email: 'admin@genoma.pt', password: 'senha123' });
    expect(res.status).toBe(200);
  });
});

describe('empresaValidator', () => {
  const app = buildApp(empresaValidator);

  test('rejeita código postal fora do formato PT (XXXX-XXX)', async () => {
    const res = await request(app).post('/test').send({ nome: 'Genoma', email: 'info@genoma.pt', codigo_postal: '1234' });
    expect(res.status).toBe(400);
  });

  test('aceita código postal no formato PT correto', async () => {
    const res = await request(app).post('/test').send({ nome: 'Genoma', email: 'info@genoma.pt', codigo_postal: '1234-567' });
    expect(res.status).toBe(200);
  });
});
