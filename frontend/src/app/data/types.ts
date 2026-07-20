export type EstadoContactoAgendamento = 'Agendado' | 'Kit Reservado';

export interface Contact {
  id: string;
  nome: string;
  data_nascimento: string;
  genero: string;
  nif: string;
  telemovel: string;
  email: string;
  morada: string;
  codigo_postal?: string;
  pais?: string;
  distrito?: string;
  cidade?: string;
  altura?: string;
  peso?: string;
  medico_id?: string;
  teste_id?: string;
  tipo_gravidez?: 'singular' | 'gemelar' | null;
  origem_conceicao?: 'natural' | 'fiv_ovulos_proprios' | 'fiv_doacao_ovulos' | null;
  quer_saber_sexo?: boolean;
  gestacao_semanas_registo?: number | null;
  gestacao_dias_registo?: number | null;
  gestacao_registada_em?: string | null;
  onde_seguida?: string;
  posto_colheita_id?: string;
  data_colheita_prevista?: string;
  colheita_periodo?: string | null;
  colheita_facturado_entidade?: boolean;
  colheita_repeticao?: boolean;
  colheita_nao_notificar?: boolean;
  colheita_semanas_gestacao?: number | null;
  colheita_dias_gestacao?: number | null;
  colheita_data_recepcao_amostra?: string | null;
  colheita_data_efetiva?: string | null;
  notas_internas?: string;
  estado_agendamento?: EstadoContactoAgendamento | null;
  /** Cancelado quando anulado pelo utilizador. */
  estado_contacto?: 'Cancelado' | null;
  motivo_anulacao_id?: string | null;
  data_anulacao?: string | null;
  created_at: string;
  fatura_emitida?: boolean;
  fatura_numero?: string;
  fatura_data_emissao?: string;
  valor_base?: number;
  desconto_percentual?: number;
  valor_final?: number;
  pagamento_data?: string;
  recibo_numero?: string;
  pago?: boolean;
  entidade_multibanco?: string;
  referencia_multibanco?: string;
  nao_gera_comissao?: boolean;
  fatura_envio_email?: string;
  fatura_envio_sms?: string;
}

export interface Anexo {
  id: string;
  paciente_id?: string;
  processo_id?: string;
  tipo: 'Documento' | 'Email' | 'Outro';
  titulo: string;
  descricao?: string;
  url?: string;
  created_at: string;
}

export interface Processo {
  id: string;
  numero: string;
  paciente_id: string;
  paciente_nome: string;
  medico: string;
  medico_id?: string;
  posto: string;
  kit_codigo: string;
  estado: 'Agendado' | 'Kit Reservado' | 'Colheita Realizada' | 'Enviado Laboratorio' | 'Em Analise' | 'Resultado Disponivel' | 'Validado' | 'Faturado' | 'Cancelado';
  data_entrada: string;
  data_colheita?: string;
  data_colheita_prevista?: string;
  data_envio_laboratorio?: string;
  data_chegada_laboratorio?: string;
  data_resultado?: string;
  data_validacao?: string;
  data_envio_relatorio?: string;
  teste: string;
  teste_id?: string;
  teste_pai_nome?: string;
  sub_teste_nome?: string;
  observacoes?: string;
  responsavel_fluxo?: string;
  relatorio_validado?: boolean;
  relatorio_enviado_para?: 'Nenhum' | 'Medico' | 'Utente' | 'Ambos';
  resultado_tudo_ok?: boolean;
  resultado_anomalias?: string;
  fracao_fetal?: string;
  fatura_emitida?: boolean;
  fatura_numero?: string;
  fatura_data_emissao?: string;
  valor_base?: number;
  desconto_percentual?: number;
  valor_final?: number;
  pagamento_data?: string;
  recibo_numero?: string;
  pago?: boolean;
  entidade_multibanco?: string;
  referencia_multibanco?: string;
  nao_gera_comissao?: boolean;
  fatura_envio_email?: string;
  fatura_envio_sms?: string;
  /** Snapshot do contacto no momento da conversão */
  onde_seguida?: string;
  tipo_gravidez?: 'singular' | 'gemelar' | null;
  origem_conceicao?: 'natural' | 'fiv_ovulos_proprios' | 'fiv_doacao_ovulos' | null;
  quer_saber_sexo?: boolean;
  gestacao_semanas_registo?: number | null;
  gestacao_dias_registo?: number | null;
  gestacao_registada_em?: string | null;
  motivo_anulacao_id?: string | null;
  motivo_anulacao_nome?: string | null;
  data_anulacao?: string | null;
  /** Data em que o processo foi concluído (faturado ou cancelado). */
  data_conclusao?: string | null;
}

export type KitFaseCiclo =
  | 'em_empresa'
  | 'em_posto_aguarda'
  | 'reservado_colheita'
  | 'aguarda_envio_lab'
  | 'em_transito_lab'
  | 'em_lab_final'
  | 'encerrado';

export interface Kit {
  id: string;
  codigo_barras: string;
  tracking?: string;
  tipo_kit: string;
  lote: string;
  status: 'Disponível' | 'Reservado' | 'Em trânsito' | 'Utilizado' | 'Inválido' | 'Perdido' | 'Expirado';
  data_validade: string;
  localizacao: 'Escritorio' | 'Posto' | 'Laboratorio';
  fase_ciclo?: KitFaseCiclo;
  empresa_id?: string;
  posto_id?: string;
  laboratorio_id?: string;
}

export interface Lote {
  id: string;
  codigo: string;
  tipo_kit: string;
  tipo_kit_id?: string;
  tipo_teste?: string;
  teste_id?: string;
  teste_nome?: string;
  quantidade_total: number;
  quantidade_disponivel: number;
  data_rececao: string;
  data_validade: string;
  fornecedor: string;
  fornecedor_id?: string;
}

export interface RequisicaoKit {
  id: string;
  numero_envio?: string;
  data: string;
  origem: 'Escritorio' | 'Posto' | 'Laboratorio';
  destino: 'Escritorio' | 'Posto' | 'Laboratorio';
  origem_nome?: string;
  destino_nome?: string;
  origem_empresa_id?: string;
  origem_posto_id?: string;
  origem_laboratorio_id?: string;
  destino_empresa_id?: string;
  destino_posto_id?: string;
  destino_laboratorio_id?: string;
  quantidade: number;
  status: 'Pendente' | 'Em trânsito' | 'Entregue' | 'Cancelada';
  tracking_number?: string;
  transportadora?: string;
  lote_codigo?: string;
  kit_ids?: string[];
  utilizador_id?: string;
  utilizador_nome?: string;
  observacoes?: string;
}

export interface MovimentoKit {
  id: string;
  data: string;
  kit_codigo: string;
  origem: 'Escritorio' | 'Posto' | 'Laboratorio';
  destino: 'Escritorio' | 'Posto' | 'Laboratorio';
  motivo: 'Envio' | 'Consumo' | 'Reposicao' | 'Transferencia' | 'SMS Colheita';
  observacoes?: string;
}

export interface Utilizador {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  ativo: boolean;
  avatar_url?: string | null;
  medico_titulo?: string | null;
}

export interface Empresa {
  id: string;
  nome: string;
  morada: string;
  codigo_postal?: string;
  cidade?: string;
  distrito?: string;
  contacto: string;
  email: string;
  nif: string;
  notas?: string;
  tipo_empresa?: 'CLINICA' | 'POSTO' | 'LABORATORIO' | 'PARCEIRO';
  pais?: string;
  ativo?: boolean;
}

export interface SubTeste {
  id: string;
  teste_pai_id: string;
  nome: string;
  descricao: string;
  preco: number;
  codigo: string;
  preco_compra?: number;
  preco_venda?: number;
  cromossomas?: number[];
  delecoes_duplicacoes?: boolean;
  microdelecoes_microduplicacoes?: boolean;
  gemeos?: boolean;
  determinacao_sexo_fetal?: boolean;
  incluir_fracao_fetal?: boolean;
  ativo?: boolean;
}

export interface Teste {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  codigo: string;
  preco_compra?: number;
  preco_venda?: number;
  tempo_resposta_dias?: number | null;
  gestacao_minima_semanas?: number | null;
  tipo_teste?: string;
  empresa?: string;
  tipo_kit?: string;
  laboratorio_final_id?: string | null;
  cromossomas?: number[];
  delecoes_duplicacoes?: boolean;
  microdelecoes_microduplicacoes?: boolean;
  gemeos?: boolean;
  determinacao_sexo_fetal?: boolean;
  incluir_fracao_fetal?: boolean;
  teste_pai_id?: string | null;
  sub_testes?: SubTeste[];
  ativo?: boolean;
}

export interface ItemPesquisa {
  id: string;
  codigo: string;
  descricao: string;
}

export interface TipoKit {
  id: string;
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export interface MotivoAnulacao {
  id: string;
  nome: string;
  ativo?: boolean;
  contexto: 'contacto' | 'processo';
  reabre_contacto?: boolean;
}

export interface SistemaSaude {
  id: string;
  nome: string;
}

export interface ContactoSecundario {
  nome: string;
  funcao: string;
  email: string;
  telefone: string;
}

export interface LocalCondicaoTeste {
  teste_id: string;
  comissao?: number | null;
  prazo_pagamento_dias?: number | null;
}

export interface LocalCondicaoTesteInput {
  teste_id: string;
  comissao: string | number | null;
  prazo_pagamento_dias: string | number | null;
}

export interface Posto {
  id: string;
  nome: string;
  codigo: string;
  entidade_id?: string | null;
  laboratorio_id?: string | null;
  morada?: string;
  codigo_postal?: string;
  cidade?: string;
  distrito?: string;
  pais?: string;
  contacto?: string;
  email?: string;
  notas?: string;
  contactos_secundarios?: ContactoSecundario[];
  condicoes_testes?: LocalCondicaoTeste[];
  ativo?: boolean;
}

export interface Laboratorio {
  id: string;
  nome: string;
  codigo?: string;
  tipo?: 'operacional' | 'final';
  morada?: string;
  codigo_postal?: string;
  cidade?: string;
  distrito?: string;
  pais?: string;
  contacto?: string;
  email?: string;
  notas?: string;
  contactos_secundarios?: ContactoSecundario[];
  condicoes_testes?: LocalCondicaoTeste[];
  ativo?: boolean;
}

export interface Entidade {
  id: string;
  nome: string;
  codigo?: string;
  morada?: string;
  codigo_postal?: string;
  cidade?: string;
  distrito?: string;
  pais?: string;
  contacto?: string;
  email?: string;
  notas?: string;
  contactos_secundarios?: ContactoSecundario[];
  condicoes_testes?: LocalCondicaoTeste[];
  ativo?: boolean;
}
