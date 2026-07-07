const { body, param, query } = require('express-validator');

/** Campos opcionais: ignora null, undefined e strings vazias antes de validar formato. */
const OPTIONAL_EMPTY = { nullable: true, checkFalsy: true };

// Validadores comuns para email
const emailValidator = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Email inválido');

const optionalEmailValidator = body('email')
  .optional(OPTIONAL_EMPTY)
  .isEmail()
  .normalizeEmail()
  .withMessage('Email inválido');

// Validadores para telefone
const telefoneValidator = body('telefone')
  .isMobilePhone('pt-PT')
  .withMessage('Número de telefone inválido');

const optionalTelefoneValidator = body('telefone')
  .optional(OPTIONAL_EMPTY)
  .isMobilePhone('pt-PT')
  .withMessage('Número de telefone inválido');

// Validadores para texto
const nomeValidator = body('nome')
  .trim()
  .notEmpty()
  .withMessage('Nome é obrigatório')
  .isLength({ min: 2, max: 100 })
  .withMessage('Nome deve ter entre 2 e 100 caracteres');

const descricaoValidator = body('descricao')
  .optional()
  .trim()
  .isLength({ max: 500 })
  .withMessage('Descrição apenas pode ter até 500 caracteres');

// Validadores para números
const precoValidator = body('preco')
  .isFloat({ min: 0 })
  .withMessage('Preço deve ser um número não negativo');

const idValidator = param('id')
  .notEmpty()
  .withMessage('ID é obrigatório')
  .matches(/^[a-f0-9-]{36}$/)
  .withMessage('ID inválido');

// Validadores para paginação
const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro maior que 0'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve estar entre 1 e 100')
];

// Validadores específicos para utilizadores
const utilizadorValidator = [
  nomeValidator,
  emailValidator,
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres'),
  optionalTelefoneValidator
];

const utilizadorUpdateValidator = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Senha deve ter no mínimo 6 caracteres'),
  optionalTelefoneValidator
];

// Validadores para pacientes
const pacienteValidator = [
  nomeValidator,
  body('data_nascimento')
    .optional(OPTIONAL_EMPTY)
    .isISO8601()
    .withMessage('Data de nascimento inválida'),
  body('genero')
    .optional(OPTIONAL_EMPTY)
    .isIn(['M', 'F', 'Outro'])
    .withMessage('Gênero inválido'),
  body('nif')
    .optional(OPTIONAL_EMPTY)
    .matches(/^\d{9}$/)
    .withMessage('NIF deve ter 9 dígitos'),
  body('telemovel')
    .optional(OPTIONAL_EMPTY)
    .isMobilePhone('pt-PT')
    .withMessage('Telemóvel inválido'),
  optionalEmailValidator,
  body('morada')
    .optional(OPTIONAL_EMPTY)
    .trim()
    .isLength({ max: 200 })
    .withMessage('Morada muito longa'),
];

const pacienteUpdateValidator = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('data_nascimento')
    .optional(OPTIONAL_EMPTY)
    .isISO8601()
    .withMessage('Data de nascimento inválida'),
  body('genero')
    .optional(OPTIONAL_EMPTY)
    .isIn(['M', 'F', 'Outro'])
    .withMessage('Gênero inválido'),
  body('nif')
    .optional(OPTIONAL_EMPTY)
    .matches(/^\d{9}$/)
    .withMessage('NIF deve ter 9 dígitos'),
  body('telemovel')
    .optional(OPTIONAL_EMPTY)
    .isMobilePhone('pt-PT')
    .withMessage('Telemóvel inválido'),
  optionalEmailValidator,
  body('morada')
    .optional(OPTIONAL_EMPTY)
    .trim()
    .isLength({ max: 200 })
    .withMessage('Morada muito longa'),
];

// Validadores para empresas
const empresaValidator = [
  nomeValidator,
  emailValidator,
  body('morada')
    .optional()
    .trim(),
  body('codigo_postal')
    .optional()
    .matches(/^[0-9]{4}-[0-9]{3}$/)
    .withMessage('Código postal deve estar no formato XXXX-XXX'),
  optionalTelefoneValidator
];

const empresaUpdateValidator = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  body('morada')
    .optional()
    .trim(),
  body('codigo_postal')
    .optional()
    .matches(/^[0-9]{4}-[0-9]{3}$/)
    .withMessage('Código postal deve estar no formato XXXX-XXX'),
  optionalTelefoneValidator
];

// Validadores para testes
const testeValidator = [
  nomeValidator,
  precoValidator,
  descricaoValidator
];

const testeUpdateValidator = [
  body('nome')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('preco')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço deve ser um número não negativo'),
  descricaoValidator
];

// Validadores para itens de pesquisa
const itemValidator = [
  body('codigo')
    .notEmpty()
    .withMessage('Código é obrigatório')
    .matches(/^[A-Z0-9_]{1,10}$/)
    .withMessage('Código deve conter apenas letras maiúsculas, números e underscore'),
  body('descricao')
    .notEmpty()
    .withMessage('Descrição é obrigatória')
    .isLength({ max: 100 })
    .withMessage('Descrição deve ter até 100 caracteres')
];

const itemUpdateValidator = [
  body('codigo')
    .optional()
    .matches(/^[A-Z0-9_]{1,10}$/)
    .withMessage('Código deve conter apenas letras maiúsculas, números e underscore'),
  body('descricao')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Descrição deve ter até 100 caracteres')
];

// Validadores para pedidos de exames
const pedidoValidator = [
  body('paciente_id')
    .notEmpty()
    .withMessage('ID do paciente é obrigatório'),
  body('medico_id')
    .notEmpty()
    .withMessage('ID do médico é obrigatório'),
  body('teste_id')
    .notEmpty()
    .withMessage('ID do teste é obrigatório'),
  body('status')
    .optional()
    .isIn([
      'Agendado',
      'Kit Reservado',
      'Colheita Realizada',
      'Enviado Laboratorio',
      'Em Analise',
      'Resultado Disponivel',
      'Validado',
      'Faturado',
      'Cancelado'
    ])
    .withMessage('Status inválido'),
  body('notas_clinicas')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notas clínicas devem ter até 500 caracteres')
];

const pedidoUpdateValidator = [
  body('status')
    .optional()
    .isIn([
      'Agendado',
      'Kit Reservado',
      'Colheita Realizada',
      'Enviado Laboratorio',
      'Em Analise',
      'Resultado Disponivel',
      'Validado',
      'Faturado',
      'Cancelado'
    ])
    .withMessage('Status inválido'),
  body('notas_clinicas')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notas clínicas devem ter até 500 caracteres')
];

// Validadores para perfis
const perfilValidator = [
  nomeValidator
];

module.exports = {
  // Validadores gerais
  emailValidator,
  optionalEmailValidator,
  telefoneValidator,
  optionalTelefoneValidator,
  nomeValidator,
  descricaoValidator,
  precoValidator,
  idValidator,
  paginationValidator,
  
  // Validadores específicos
  utilizadorValidator,
  utilizadorUpdateValidator,
  pacienteValidator,
  pacienteUpdateValidator,
  empresaValidator,
  empresaUpdateValidator,
  testeValidator,
  testeUpdateValidator,
  itemValidator,
  itemUpdateValidator,
  pedidoValidator,
  pedidoUpdateValidator,
  perfilValidator
};
