import { Contact, Processo } from '../app/data/types';
import {
  ProcessFaturacaoData,
  computeValorFinal,
  extractFaturacaoFromProcesso,
} from './process-form';

export type FaturacaoAlertType = 'nao_facturado' | 'nao_pago';

export function isFaturaEmitida(data: ProcessFaturacaoData): boolean {
  return !!(data.fatura_numero?.trim() && data.fatura_data_emissao);
}

export function isFaturaPaga(data: ProcessFaturacaoData): boolean {
  return !!data.recibo_numero?.trim();
}

export function getFaturacaoAlert(
  data: ProcessFaturacaoData,
  context: 'contacto' | 'processo' = 'contacto',
): { type: FaturacaoAlertType; messageKey: string } | null {
  if (!isFaturaEmitida(data)) {
    return {
      type: 'nao_facturado',
      messageKey: context === 'processo'
        ? 'faturacao.alert.processNotInvoiced'
        : 'faturacao.alert.contactNotInvoiced',
    };
  }
  if (!isFaturaPaga(data)) {
    return {
      type: 'nao_pago',
      messageKey: context === 'processo'
        ? 'faturacao.alert.processNotPaid'
        : 'faturacao.alert.contactNotPaid',
    };
  }
  return null;
}

export const extractFaturacaoFromContact = (contact: Contact): ProcessFaturacaoData => ({
  valor_base: contact.valor_base || 0,
  desconto_percentual: contact.desconto_percentual || 0,
  valor_final: contact.valor_final || 0,
  fatura_emitida: contact.fatura_emitida || false,
  fatura_numero: contact.fatura_numero || '',
  fatura_data_emissao: contact.fatura_data_emissao || '',
  entidade_multibanco: contact.entidade_multibanco || '',
  referencia_multibanco: contact.referencia_multibanco || '',
  nao_gera_comissao: contact.nao_gera_comissao || false,
  fatura_envio_email: contact.fatura_envio_email || '',
  fatura_envio_sms: contact.fatura_envio_sms || '',
  pago: contact.pago || false,
  pagamento_data: contact.pagamento_data || '',
  recibo_numero: contact.recibo_numero || '',
});

export function resolveFaturacao(contact: Contact, processo?: Processo | null): ProcessFaturacaoData {
  if (processo) return extractFaturacaoFromProcesso(processo);
  return extractFaturacaoFromContact(contact);
}

export function mergeFaturacaoIntoContact(
  contact: Omit<Contact, 'id' | 'created_at'>,
  faturacao: ProcessFaturacaoData,
): Omit<Contact, 'id' | 'created_at'> {
  const payload = {
    valor_base: faturacao.valor_base ?? 0,
    desconto_percentual: faturacao.desconto_percentual ?? 0,
    valor_final: computeValorFinal(faturacao.valor_base ?? 0, faturacao.desconto_percentual ?? 0),
    fatura_emitida: isFaturaEmitida(faturacao),
    fatura_numero: faturacao.fatura_numero || undefined,
    fatura_data_emissao: faturacao.fatura_data_emissao || undefined,
    entidade_multibanco: faturacao.entidade_multibanco || undefined,
    referencia_multibanco: faturacao.referencia_multibanco || undefined,
    nao_gera_comissao: faturacao.nao_gera_comissao || false,
    fatura_envio_email: faturacao.fatura_envio_email || undefined,
    fatura_envio_sms: faturacao.fatura_envio_sms || undefined,
    pago: faturacao.pago || false,
    pagamento_data: faturacao.pagamento_data || undefined,
    recibo_numero: faturacao.recibo_numero || undefined,
  };
  return { ...contact, ...payload };
}
