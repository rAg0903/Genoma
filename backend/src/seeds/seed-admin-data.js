/**
 * Dados de referência para Administração (Genoma CRM).
 * Baseado na configuração actual do ambiente + campos em falta preenchidos.
 */

const PROCESSO_STATUS = [
  ['Agendado', 1],
  ['Kit Reservado', 2],
  ['Colheita Realizada', 3],
  ['Enviado Laboratorio', 4],
  ['Em Analise', 5],
  ['Resultado Disponivel', 6],
  ['Validado', 7],
  ['Faturado', 8],
  ['Cancelado', 9],
];

const PERFIS = ['Administrador', 'Assistente', 'Medico'];

const STOCK_SUBMODULES = ['kits', 'lotes', 'requisicoes', 'descartes', 'movimentos', 'auditoria'];

const EMPRESAS = [
  {
    key: 'genoma',
    nome: 'Genoma',
    morada: 'Praça Mouzinho de Albuquerque, 113 - 5º',
    codigo_postal: '4100-359',
    telefone: '+351 918768897',
    email: 'genomabusiness@genoma.pt',
    tipo_empresa: 'CLINICA',
    nif: '510987672',
    pais: 'Portugal',
    contacto: 'Rafael Males',
    ativo: true,
  },
];

const TIPOS_KIT = [{ key: 'maternity', nome: 'Maternity', ativo: true }];

const LABORATORIOS = [
  {
    key: 'fhuk',
    nome: 'FeatureHealth UK',
    codigo: 'FHUK-001',
    morada: 'Unit 5, Apex Business Park, Apex Way',
    codigo_postal: 'LE19 1SX',
    cidade: 'Hinckley',
    distrito: 'Leicestershire',
    pais: 'Reino Unido',
    contacto: '+44 116 123 4567',
    email: 'lab@featurehealth.co.uk',
    notas: 'Laboratório final de processamento NIPT.',
    tipo: 'final',
    ativo: true,
    contactos_secundarios: [
      { nome: 'Sarah Mitchell', funcao: 'Lab Manager', email: 's.mitchell@featurehealth.co.uk', telefone: '+44 116 123 4561' },
      { nome: 'James Cooper', funcao: 'Quality Assurance', email: 'j.cooper@featurehealth.co.uk', telefone: '+44 116 123 4562' },
      { nome: 'Helen Wright', funcao: 'Logistics', email: 'h.wright@featurehealth.co.uk', telefone: '+44 116 123 4563' },
    ],
  },
  {
    key: 'unilabs',
    nome: 'Unilabs',
    codigo: 'UNI-001',
    morada: 'Rua Castilho, 39 - 6º',
    codigo_postal: '1250-066',
    cidade: 'Lisboa',
    distrito: 'Lisboa',
    pais: 'Portugal',
    contacto: '+351 21 381 7700',
    email: 'clientes@unilabs.pt',
    notas: 'Rede nacional de medicina laboratorial.',
    tipo: 'operacional',
    ativo: true,
    contactos_secundarios: [
      { nome: 'Ana Rodrigues', funcao: 'Gestora Comercial', email: 'a.rodrigues@unilabs.pt', telefone: '+351 21 381 7701' },
      { nome: 'Pedro Santos', funcao: 'Coordenação Técnica', email: 'p.santos@unilabs.pt', telefone: '+351 21 381 7702' },
    ],
    condicoes_testes: [{ sub_codigo: 'MT-001', comissao: 12.5, prazo_pagamento_dias: 45 }],
  },
  {
    key: 'synlab',
    nome: 'Synlab',
    codigo: 'SLB-001',
    morada: 'Rua Castilho, 39 - 6º',
    codigo_postal: '1250-066',
    cidade: 'Lisboa',
    distrito: 'Lisboa',
    pais: 'Portugal',
    contacto: '+351 21 848 2275',
    email: 'info@synlab.pt',
    notas: 'Laboratório operacional — colheitas e logística.',
    tipo: 'operacional',
    ativo: true,
    contactos_secundarios: [
      { nome: 'Carla Mendes', funcao: 'Responsável Postos', email: 'c.mendes@synlab.pt', telefone: '+351 21 848 2276' },
    ],
    condicoes_testes: [{ sub_codigo: 'MT-002', comissao: 10, prazo_pagamento_dias: 30 }],
  },
  {
    key: 'gds',
    nome: 'Germano de Sousa',
    codigo: 'GDS-001',
    morada: 'R. Cupertino de Miranda',
    codigo_postal: '1600-513',
    cidade: 'Lisboa',
    distrito: 'Lisboa',
    pais: 'Portugal',
    contacto: '+351 21 269 3530',
    email: 'clientes@germanosousa.pt',
    notas: 'Medicina laboratorial — sede e rede de postos.',
    tipo: 'operacional',
    ativo: true,
    contactos_secundarios: [
      { nome: 'Luísa Ferreira', funcao: 'Direção Técnica', email: 'l.ferreira@germanosousa.pt', telefone: '+351 21 269 3531' },
      { nome: 'Miguel Costa', funcao: 'Comercial', email: 'm.costa@germanosousa.pt', telefone: '+351 21 269 3532' },
    ],
    condicoes_testes: [{ sub_codigo: 'MT-003', comissao: 15, prazo_pagamento_dias: 60 }],
  },
];

const TESTE_PAI = {
  key: 'maternity',
  nome: 'Maternity',
  codigo: 'MT-001',
  descricao: 'Painel NIPT Maternity — testes de rastreio pré-natal não invasivo.',
  tipo_teste: 'Maternity',
  empresa: 'Genoma',
  tipo_kit: 'Maternity',
  ativo: true,
};

const SUB_TESTES = [
  {
    key: 'basico',
    codigo: 'MT-001',
    nome: 'Básico',
    tipo_teste: 'Maternity 21 Plus Core',
    preco: 372,
    preco_compra: 150,
    preco_venda: 372,
    tempo_resposta_dias: 8,
    gestacao_minima_semanas: 10,
    cromossomas: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21',
    delecoes_duplicacoes: true,
    microdelecoes_microduplicacoes: true,
    gemeos: true,
    determinacao_sexo_fetal: true,
    incluir_fracao_fetal: true,
    lab_key: 'fhuk',
  },
  {
    key: 'intermedio',
    codigo: 'MT-002',
    nome: 'Intermédio',
    tipo_teste: 'Maternity Intermédio',
    preco: 496,
    preco_compra: 200,
    preco_venda: 496,
    tempo_resposta_dias: 10,
    gestacao_minima_semanas: 10,
    cromossomas: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21',
    delecoes_duplicacoes: false,
    microdelecoes_microduplicacoes: false,
    gemeos: false,
    determinacao_sexo_fetal: false,
    incluir_fracao_fetal: true,
    lab_key: 'fhuk',
  },
  {
    key: 'completo',
    codigo: 'MT-003',
    nome: 'Completo',
    tipo_teste: 'Maternity Genome',
    preco: 744,
    preco_compra: 300,
    preco_venda: 744,
    tempo_resposta_dias: 8,
    gestacao_minima_semanas: 10,
    cromossomas: '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23',
    delecoes_duplicacoes: true,
    microdelecoes_microduplicacoes: true,
    gemeos: true,
    determinacao_sexo_fetal: true,
    incluir_fracao_fetal: true,
    lab_key: 'fhuk',
  },
];

const ENTIDADES = [
  { codigo: 'ENT-CCF-PTO', nome: 'Clínica CUF Porto', cidade: 'Porto', distrito: 'Porto', codigo_postal: '4100-180', morada: 'Rua Marquês de Pombal, 145' },
  { codigo: 'ENT-CCF-TEJ', nome: 'Clínica CUF Tejo', cidade: 'Lisboa', distrito: 'Lisboa', codigo_postal: '1998-018', morada: 'Rua da Piscina, 36' },
  { codigo: 'ENT-CLU-LIS', nome: 'Clínica Lusíadas Lisboa', cidade: 'Lisboa', distrito: 'Lisboa', codigo_postal: '1600-706', morada: 'Av. Lusíada, 100' },
  { codigo: 'ENT-CLU-PTO', nome: 'Clínica Lusíadas Porto', cidade: 'Porto', distrito: 'Porto', codigo_postal: '4150-338', morada: 'Rua de D. Manuel II, 291' },
  { codigo: 'ENT-CMI-LIS', nome: 'Clínica Médica Internacional de Lisboa', cidade: 'Lisboa', distrito: 'Lisboa', codigo_postal: '1400-204', morada: 'Av. Duque de Loulé, 12' },
  { codigo: 'ENT-CSJ-001', nome: 'Clínica São João de Deus', cidade: 'Lisboa', distrito: 'Lisboa', codigo_postal: '1200-837', morada: 'Rua de São João de Deus, 9' },
  { codigo: 'ENT-CTS-BRA', nome: 'Clínica Trofa Saúde Braga', cidade: 'Braga', distrito: 'Braga', codigo_postal: '4710-427', morada: 'Av. da Liberdade, 1230' },
  { codigo: 'ENT-CTS-GAI', nome: 'Clínica Trofa Saúde Gaia', cidade: 'Vila Nova de Gaia', distrito: 'Porto', codigo_postal: '4400-346', morada: 'Rua de Camões, 1078' },
  { codigo: 'ENT-CTS-MAI', nome: 'Clínica Trofa Saúde Maia', cidade: 'Maia', distrito: 'Porto', codigo_postal: '4470-575', morada: 'Rua da Praia, 100' },
  { codigo: 'ENT-CTS-PTO', nome: 'Clínica Trofa Saúde Porto', cidade: 'Porto', distrito: 'Porto', codigo_postal: '4200-135', morada: 'Rua de Costa Cabral, 950' },
  { codigo: 'ENT-HCF-PTO', nome: 'Hospital CUF Porto', cidade: 'Porto', distrito: 'Porto', codigo_postal: '4100-180', morada: 'Rua Marquês de Pombal, 145' },
  { codigo: 'ENT-HCF-TEJ', nome: 'Hospital CUF Tejo', cidade: 'Lisboa', distrito: 'Lisboa', codigo_postal: '1998-018', morada: 'Rua da Piscina, 36' },
  { codigo: 'ENT-HCF-VIS', nome: 'Hospital CUF Viseu', cidade: 'Viseu', distrito: 'Viseu', codigo_postal: '3504-509', morada: 'Av. da Beira Alta, 2' },
  { codigo: 'ENT-HDL-AMA', nome: 'Hospital da Luz Amadora', cidade: 'Amadora', distrito: 'Lisboa', codigo_postal: '2700-500', morada: 'Av. Comendador Fernando Cabral, 1' },
  { codigo: 'ENT-HDL-ARR', nome: 'Hospital da Luz Arrábida', cidade: 'Setúbal', distrito: 'Setúbal', codigo_postal: '2900-616', morada: 'Rua Manuel de Arriaga, 16' },
  { codigo: 'ENT-HDL-OEI', nome: 'Hospital da Luz Clínica de Oeiras', cidade: 'Oeiras', distrito: 'Lisboa', codigo_postal: '2780-272', morada: 'Rua da Misericórdia, 2' },
  { codigo: 'ENT-HDL-LIS', nome: 'Hospital da Luz Lisboa', cidade: 'Lisboa', distrito: 'Lisboa', codigo_postal: '1600-706', morada: 'Av. Lusíada, 100' },
  { codigo: 'ENT-HDL-MAT', nome: 'Hospital da Luz Matosinhos', cidade: 'Matosinhos', distrito: 'Porto', codigo_postal: '4450-124', morada: 'Rua de Brito Capelo, 275' },
  { codigo: 'ENT-HLU-LIS', nome: 'Hospital Lusíadas Lisboa', cidade: 'Lisboa', distrito: 'Lisboa', codigo_postal: '1600-706', morada: 'Av. Lusíada, 100' },
  { codigo: 'ENT-HLU-PTO', nome: 'Hospital Lusíadas Porto', cidade: 'Porto', distrito: 'Porto', codigo_postal: '4150-338', morada: 'Rua de D. Manuel II, 291' },
];

const POSTOS = [
  { codigo_posto: 'GERS-001', nome: 'Germano de Sousa - Sede e Laboratório Central Telheiras', lab_key: 'gds', morada: 'R. Cupertino de Miranda', codigo_postal: '1600-513', cidade: 'Lisboa', distrito: 'Lisboa', contacto: '+351 21 269 3530', email: 'clientes@germanosousa.pt' },
  { codigo_posto: 'GERS-002', nome: 'Centro de Medicina Laboratorial Germano de Sousa - Porto', lab_key: 'gds', morada: 'R. dos Heróis e dos Mártires de Angola, nº 15, Lj. 18', codigo_postal: '4000-285', cidade: 'Porto', distrito: 'Porto', contacto: '+351 22 004 3010', email: 'clientes@germanosousa.pt' },
  { codigo_posto: 'GERS-003', nome: 'Germano de Sousa - Avenida de Roma', lab_key: 'gds', morada: 'Av. de Roma 45 A', codigo_postal: '1700-348', cidade: 'Lisboa', distrito: 'Lisboa', contacto: '+351 21 796 0294', email: 'clientes@germanosousa.pt' },
  { codigo_posto: 'SLBC-001', nome: 'Synlab Campanhã', lab_key: 'synlab', morada: 'R. Camilo Pessanha 8', codigo_postal: '4300-097', cidade: 'Porto', distrito: 'Porto', contacto: '+351 300 029 134', email: 'porto@synlab.pt' },
  { codigo_posto: 'SLBL-001', nome: 'Synlab Lisboa', lab_key: 'synlab', morada: 'Av. de Paris 24', codigo_postal: '1000-229', cidade: 'Lisboa', distrito: 'Lisboa', contacto: '+351 21 848 2275', email: 'lisboa@synlab.pt' },
  { codigo_posto: 'UNIP-001', nome: 'Unilabs Porto | Costa Cabral', lab_key: 'unilabs', morada: 'Rua de Costa Cabral 2252', codigo_postal: '4200-218', cidade: 'Porto', distrito: 'Porto', contacto: '+351 22 240 1401', email: 'clientes@unilabs.pt' },
  { codigo_posto: 'UNIP-002', nome: 'Unilabs Porto | Constituição Marquês', lab_key: 'unilabs', morada: 'R. da Constituição 825 R/C', codigo_postal: '4200-201', cidade: 'Porto', distrito: 'Porto', contacto: '+351 22 240 1401', email: 'clientes@unilabs.pt' },
  { codigo_posto: 'UNIP-003', nome: 'Unilabs Porto | Campo Alegre', lab_key: 'unilabs', morada: 'Rua do Campo Alegre 231 1º piso', codigo_postal: '4150-178', cidade: 'Porto', distrito: 'Porto', contacto: '+351 22 240 1401', email: 'clientes@unilabs.pt' },
];

const UTILIZADORES_STAFF = [
  {
    key: 'admin',
    perfil: 'Administrador',
    nome: 'Nuno Araújo',
    email: 'admin.teste@genoma.local',
    telefone: '+351900000001',
    password: 'Teste1234!',
  },
  {
    key: 'assistente',
    perfil: 'Assistente',
    nome: 'Assistente Teste',
    email: 'assistente.teste@genoma.local',
    telefone: '+351900000003',
    password: 'Teste1234!',
  },
];

const MEDICOS = [
  {
    key: 'manuel',
    nome: 'Manuel Gomes Silva',
    email: 'manuelgomessilva@genoma.pt',
    telefone_movel: '912768365',
    num_ordem: '28476553',
    titulo: 'Dr.',
    genero: 'Masculino',
    especialidade: 'Obstetrícia e Ginecologia',
    pais: 'Portugal',
    telefone_fixo: '+351 22 123 4567',
    criterio_busca_postos: 'nome',
    notas: 'Médico prescrivente — zona Norte.',
    password: 'Teste1234!',
    entidades: ['ENT-CTS-PTO', 'ENT-CCF-PTO', 'ENT-HLU-PTO'],
    contactos_secundarios: [
      { nome: 'Secretariado Dr. Manuel', funcao: 'Secretariado', email: 'secretaria.manuel@genoma.pt', telefone: '+351 22 123 4568' },
      { nome: 'Enfermeira Coordenadora', funcao: 'Enfermagem', email: 'enfermagem.manuel@genoma.pt', telefone: '+351 22 123 4569' },
    ],
    condicoes_testes: [
      { sub_codigo: 'MT-001', comissao: 8, prazo_pagamento_dias: 30 },
      { sub_codigo: 'MT-002', comissao: 10, prazo_pagamento_dias: 30 },
    ],
  },
  {
    key: 'sofia',
    nome: 'Sofia Silva',
    email: 'sofiasilva@genoma.pt',
    telefone_movel: '912764836',
    num_ordem: '28476578',
    titulo: 'Dra.',
    genero: 'Feminino',
    especialidade: 'Medicina Materno-Fetal',
    pais: 'Portugal',
    telefone_fixo: '+351 21 234 5678',
    criterio_busca_postos: 'cidade',
    notas: 'Consultas em Lisboa e margem sul.',
    password: 'Teste1234!',
    entidades: ['ENT-HDL-LIS', 'ENT-HCF-TEJ', 'ENT-CLU-LIS'],
    contactos_secundarios: [
      { nome: 'Gabinete Dra. Sofia', funcao: 'Secretariado', email: 'gabinete.sofia@genoma.pt', telefone: '+351 21 234 5679' },
    ],
    condicoes_testes: [{ sub_codigo: 'MT-003', comissao: 12, prazo_pagamento_dias: 45 }],
  },
  {
    key: 'anaclara',
    nome: 'Ana Clara da Costa Ferreira',
    email: 'anaclaraferreira@genoma.pt',
    telefone_movel: '912875348',
    num_ordem: '3124235233',
    titulo: 'Dra.',
    genero: 'Feminino',
    especialidade: 'Obstetrícia',
    pais: 'Portugal',
    telefone_fixo: '222 435 324',
    criterio_busca_postos: 'nome',
    notas: 'Rede CUF e Trofa — Porto.',
    password: 'Teste1234!',
    entidades: ['ENT-CTS-PTO', 'ENT-CCF-PTO', 'ENT-CLU-PTO'],
    contactos_secundarios: [
      { nome: 'Assistente Clínico', funcao: 'Assistente', email: 'assistente.anaclara@genoma.pt', telefone: '222 435 325' },
      { nome: 'Coordenação Obstétrica', funcao: 'Coordenação', email: 'coord.obstetricia@genoma.pt', telefone: '222 435 326' },
    ],
    condicoes_testes: [
      { sub_codigo: 'MT-001', comissao: 9, prazo_pagamento_dias: 30 },
      { sub_codigo: 'MT-003', comissao: 14, prazo_pagamento_dias: 45 },
    ],
  },
];

const MOTIVOS_ANULACAO = [
  { nome: 'Desistência', contexto: 'contacto', reabre_contacto: false },
  { nome: 'Perda do bebé', contexto: 'contacto', reabre_contacto: false },
  { nome: 'Erro atribuição processo', contexto: 'processo', reabre_contacto: false },
  { nome: 'Repetição de colheita', contexto: 'processo', reabre_contacto: true },
];

/** Contactos secundários genéricos para entidades (adaptados por índice). */
function entidadeContactos(entidade, index) {
  const slug = entidade.codigo.replace('ENT-', '').toLowerCase();
  return [
    {
      nome: `Receção ${entidade.nome.split(' ').slice(-1)[0]}`,
      funcao: 'Receção',
      email: `rececao.${slug}@clinica.pt`,
      telefone: `+351 21 ${String(100000 + index).slice(-6)}`,
    },
    {
      nome: 'Coordenação Obstétrica',
      funcao: 'Coordenação',
      email: `obstetricia.${slug}@clinica.pt`,
      telefone: `+351 21 ${String(200000 + index).slice(-6)}`,
    },
  ];
}

/** Condições comerciais por entidade (primeiros 5 sub-testes variados). */
function entidadeCondicoes(subTesteIds, index) {
  const codes = ['MT-001', 'MT-002', 'MT-003'];
  const pick = codes[index % codes.length];
  const testeId = subTesteIds[pick];
  if (!testeId) return [];
  return [{ teste_id: testeId, comissao: 5 + (index % 5), prazo_pagamento_dias: 30 + (index % 3) * 15 }];
}

module.exports = {
  PROCESSO_STATUS,
  PERFIS,
  STOCK_SUBMODULES,
  EMPRESAS,
  TIPOS_KIT,
  LABORATORIOS,
  TESTE_PAI,
  SUB_TESTES,
  ENTIDADES,
  POSTOS,
  UTILIZADORES_STAFF,
  MEDICOS,
  MOTIVOS_ANULACAO,
  entidadeContactos,
  entidadeCondicoes,
};
