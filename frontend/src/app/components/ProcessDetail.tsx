import { ArrowLeft, Edit, Trash2, User, Stethoscope, Package, FlaskConical, CheckCircle, Circle, Clock } from 'lucide-react';
import { Processo } from '../data/types';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'sonner';
import { StatusBadge } from './shared/StatusBadge';
import { PROCESS_STATUS_STYLES } from '../../lib/design-system';
import { formatCalendarDatePt, todayLocal } from '../../lib/dates';

interface ProcessDetailProps {
  processo: Processo;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateEstado: (estado: Processo['estado']) => void;
  onPatchProcess?: (data: Partial<Processo>, successMessage?: string) => void | Promise<void>;
  canUpdate?: boolean;
  canDelete?: boolean;
  canUpdateEstado?: boolean;
}

const estados: Processo['estado'][] = [
  'Agendado',
  'Kit Reservado',
  'Colheita Realizada',
  'Enviado Laboratorio',
  'Em Analise',
  'Resultado Disponivel',
  'Validado',
  'Faturado',
  'Cancelado',
];

export function ProcessDetail({
  processo,
  onBack,
  onEdit,
  onDelete,
  onUpdateEstado,
  onPatchProcess,
  canUpdate = true,
  canDelete = true,
  canUpdateEstado = true,
}: ProcessDetailProps) {
  const { contacts } = useData();
  const { isDark } = useTheme();
  const paciente = contacts.find(c => c.id === processo.paciente_id);
  const currentEstadoIdx = estados.indexOf(processo.estado);

  const estadoMeta: Record<string, { color: string; bg: string; border: string; darkColor: string; darkBg: string; darkBorder: string }> = {
    Agendado: { color: '#d97706', bg: '#fffbeb', border: '#fde68a', darkColor: '#fbbf24', darkBg: 'rgba(120,53,15,0.2)', darkBorder: 'rgba(120,53,15,0.4)' },
    'Kit Reservado': { color: '#ca8a04', bg: '#fef9c3', border: '#fde047', darkColor: '#facc15', darkBg: 'rgba(113,63,18,0.2)', darkBorder: 'rgba(113,63,18,0.4)' },
    'Colheita Realizada': { color: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe', darkColor: '#818cf8', darkBg: 'rgba(55,48,163,0.2)', darkBorder: 'rgba(55,48,163,0.4)' },
    'Enviado Laboratorio': { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', darkColor: '#60a5fa', darkBg: 'rgba(30,58,138,0.2)', darkBorder: 'rgba(30,58,138,0.4)' },
    'Em Analise': { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', darkColor: '#a78bfa', darkBg: 'rgba(76,29,149,0.2)', darkBorder: 'rgba(76,29,149,0.4)' },
    'Resultado Disponivel': { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', darkColor: '#34d399', darkBg: 'rgba(6,95,70,0.2)', darkBorder: 'rgba(6,95,70,0.4)' },
    Validado: { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', darkColor: '#4ade80', darkBg: 'rgba(20,83,45,0.2)', darkBorder: 'rgba(20,83,45,0.4)' },
    Faturado: { color: '#65a30d', bg: '#f7fee7', border: '#bef264', darkColor: '#a3e635', darkBg: 'rgba(63,98,18,0.2)', darkBorder: 'rgba(63,98,18,0.4)' },
    Cancelado: { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', darkColor: '#f87171', darkBg: 'rgba(127,29,29,0.2)', darkBorder: 'rgba(127,29,29,0.4)' },
  };

  const meta = estadoMeta[processo.estado];
  const hoje = todayLocal();
  const valorBase = Number(processo.valor_base || 0);
  const desconto = Number(processo.desconto_percentual || 0);
  const valorFinal = Number(processo.valor_final ?? (valorBase * (1 - desconto / 100))).toFixed(2);
  const faturacaoPendente = !!processo.fatura_emitida && !processo.pagamento_data;

  const patchProcess = async (data: Partial<Processo>, successMessage?: string) => {
    if (!canUpdate || !onPatchProcess) return;
    await onPatchProcess(data, successMessage);
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <h1 className="text-gray-900 dark:text-gray-100" style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'monospace' }}>{processo.numero}</h1>
              <StatusBadge status={processo.estado} map={PROCESS_STATUS_STYLES} className="flex-shrink-0" />
            </div>
            <p className="text-gray-400 dark:text-gray-500 truncate" style={{ fontSize: '12px', marginTop: 2 }}>
              {processo.paciente_nome} · {processo.teste} · Entrada: {formatCalendarDatePt(processo.data_entrada)}
            </p>
          </div>
          {(canUpdate || canDelete) && (
            <div className="flex gap-2 flex-shrink-0">
              {canUpdate && <button onClick={onEdit} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm" style={{ fontSize: '13px', fontWeight: 500 }}>
                <Edit className="w-4 h-4" /> <span className="hidden sm:inline">Editar</span>
              </button>}
              {canDelete && <button onClick={onDelete} className="flex items-center gap-2 px-3 md:px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" style={{ fontSize: '13px', fontWeight: 500 }}>
                <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Eliminar</span>
              </button>}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-4 md:space-y-5">
        {/* Workflow */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600, marginBottom: 20 }}>Workflow do Processo</h2>
          <div className="relative flex items-start">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" style={{ zIndex: 0 }} />
            <div
              className="absolute top-5 left-0 h-0.5 bg-blue-500 transition-all duration-500"
              style={{ width: `${(currentEstadoIdx / (estados.length - 1)) * 100}%`, zIndex: 0 }}
            />
            {estados.map((e, i) => {
              const done = i <= currentEstadoIdx;
              const current = i === currentEstadoIdx;
              return (
                <div key={e} className="flex-1 flex flex-col items-center relative" style={{ zIndex: 1 }}>
                  <button
                    onClick={() => {
                      if (!canUpdateEstado) return;
                      onUpdateEstado(e);
                      toast.success(`Estado atualizado para "${e}"`);
                    }}
                    disabled={!canUpdateEstado}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      done
                        ? 'bg-teal-600 border-teal-600 shadow-md'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-teal-300 dark:hover:border-teal-500'
                    } ${current ? 'ring-4 ring-teal-100 dark:ring-teal-900/50' : ''} ${!canUpdateEstado ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title={`Marcar como ${e}`}
                  >
                    {done
                      ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                      : <Circle className="w-4 h-4 md:w-5 md:h-5 text-gray-300 dark:text-gray-600" />
                    }
                  </button>
                  <div className="mt-2 md:mt-3 text-center px-1">
                    <div style={{ fontSize: '11px', fontWeight: current ? 600 : 400 }} className={done ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}>{e}</div>
                    {current && (
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        <Clock className="w-2.5 h-2.5 text-blue-400" />
                        <span className="text-blue-400 hidden md:inline" style={{ fontSize: '10px' }}>Atual</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-2 justify-end">
            {estados.map(e => (
              <button
                key={e}
                onClick={() => {
                  if (!canUpdateEstado) return;
                  onUpdateEstado(e);
                  toast.success(`Estado atualizado para "${e}"`);
                }}
                disabled={e === processo.estado || !canUpdateEstado}
                className="px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontSize: '12px', fontWeight: 500,
                  backgroundColor: e === processo.estado
                    ? (isDark ? estadoMeta[e].darkBg : estadoMeta[e].bg)
                    : (isDark ? 'transparent' : 'white'),
                  color: isDark ? estadoMeta[e].darkColor : estadoMeta[e].color,
                  borderColor: e === processo.estado
                    ? (isDark ? estadoMeta[e].darkBorder : estadoMeta[e].border)
                    : (isDark ? '#374151' : '#e5e7eb'),
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          <div className="lg:col-span-2 space-y-4 md:space-y-5">
            {/* Patient Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600 }}>Paciente</h2>
              </div>
              {paciente ? (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 dark:text-blue-400" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {paciente.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1">
                    <InfoField label="Nome" value={paciente.nome} />
                    <InfoField label="NIF" value={paciente.nif || '—'} mono />
                    <InfoField label="Telemóvel" value={paciente.telemovel || '—'} />
                    <InfoField label="Email" value={paciente.email || '—'} />
                    <InfoField label="Morada" value={paciente.morada || '—'} />
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '13px' }}>Paciente não encontrado</p>
              )}
            </div>

            {/* Process Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Stethoscope className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600 }}>Dados do Processo</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InfoField label="Médico" value={processo.medico} />
                <InfoField label="Posto" value={processo.posto} />
                <InfoField label="Teste" value={processo.teste} />
                <InfoField label="Data de Entrada" value={formatCalendarDatePt(processo.data_entrada)} />
              </div>
            </div>

            {/* Kit */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600 }}>Kit Utilizado</h2>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <div className="text-gray-900 dark:text-gray-100" style={{ fontSize: '14px', fontWeight: 500, fontFamily: 'monospace' }}>{processo.kit_codigo || '—'}</div>
                  <div className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>Código de barras do kit</div>
                </div>
              </div>
            </div>

            {/* Observações */}
            {processo.observacoes && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <FlaskConical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600 }}>Observações / Resultados</h2>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-300" style={{ fontSize: '14px', lineHeight: 1.6 }}>{processo.observacoes}</p>
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600 }}>Resultado Estruturado</h2>
              </div>
              <div className="space-y-3">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full ${processo.resultado_tudo_ok !== false ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`} style={{ fontSize: '12px', fontWeight: 600 }}>
                  {processo.resultado_tudo_ok !== false ? 'Tudo OK' : 'Com anomalias'}
                </div>
                {processo.resultado_tudo_ok === false && processo.resultado_anomalias ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-800">
                    <p className="text-amber-800 dark:text-amber-300" style={{ fontSize: '13px', lineHeight: 1.5 }}>{processo.resultado_anomalias}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '13px' }}>Sem anomalias assinaladas.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="space-y-4 md:space-y-5">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600 }}>Informações</h2>
              <InfoField label="Nº Processo" value={processo.numero} mono />
              <div>
                <div className="text-gray-400 dark:text-gray-500" style={{ fontSize: '11px', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estado atual</div>
                <StatusBadge status={processo.estado} map={PROCESS_STATUS_STYLES} />
              </div>
              <InfoField label="Data entrada" value={formatCalendarDatePt(processo.data_entrada)} />
              <InfoField label="Tipo de teste" value={processo.teste} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600 }}>Ciclo e Relatório</h2>
              <InfoField label="Data colheita" value={formatCalendarDatePt(processo.data_colheita)} />
              <InfoField label="Chegada laboratório" value={formatCalendarDatePt(processo.data_chegada_laboratorio)} />
              <InfoField label="Data resultado" value={formatCalendarDatePt(processo.data_resultado)} />
              <InfoField label="Data validação" value={formatCalendarDatePt(processo.data_validacao)} />
              <InfoField label="Data envio relatório" value={formatCalendarDatePt(processo.data_envio_relatorio)} />
              <InfoField label="Enviado para" value={processo.relatorio_enviado_para || 'Nenhum'} />
              <InfoField label="Responsável" value={processo.responsavel_fluxo || '—'} />

              {canUpdate && (
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => patchProcess({ data_resultado: processo.data_resultado || hoje }, 'Relatório gerado (estado interno atualizado).')}
                    className="w-full px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    Gerar Relatório
                  </button>
                  <button
                    onClick={() => patchProcess({ relatorio_validado: true, data_validacao: processo.data_validacao || hoje }, 'Relatório validado.')}
                    className="w-full px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    Validar Relatório
                  </button>
                  <button
                    onClick={() => patchProcess({ data_envio_relatorio: hoje, relatorio_enviado_para: processo.relatorio_enviado_para === 'Nenhum' ? 'Medico' : processo.relatorio_enviado_para || 'Medico' }, 'Envio de relatório registado.')}
                    className="w-full px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    Marcar Envio de Relatório
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600 }}>Faturação</h2>
              <InfoField label="Valor base" value={`${valorBase.toFixed(2)} €`} />
              <InfoField label="Desconto" value={`${desconto}%`} />
              <InfoField label="Valor final" value={`${valorFinal} €`} />
              <InfoField label="Nº fatura" value={processo.fatura_numero || '—'} />
              <InfoField label="Data emissão" value={formatCalendarDatePt(processo.fatura_data_emissao)} />
              <InfoField label="Data pagamento" value={formatCalendarDatePt(processo.pagamento_data)} />
              <InfoField label="Nº recibo" value={processo.recibo_numero || '—'} />

              <div className="pt-1">
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full ${processo.pagamento_data ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : faturacaoPendente ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`} style={{ fontSize: '12px', fontWeight: 600 }}>
                  {processo.pagamento_data ? 'Pago' : faturacaoPendente ? 'Pendente' : 'Sem fatura'}
                </div>
              </div>

              {canUpdate && (
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => patchProcess({ fatura_emitida: true, fatura_data_emissao: processo.fatura_data_emissao || hoje, fatura_numero: processo.fatura_numero || `FT-${processo.numero.replace(/[^0-9]/g, '')}` }, 'Fatura emitida. Pendência criada.')}
                    className="w-full px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    Emitir Fatura
                  </button>
                  <button
                    onClick={() => patchProcess({ pagamento_data: processo.pagamento_data || hoje, recibo_numero: processo.recibo_numero || `RC-${processo.numero.replace(/[^0-9]/g, '')}` }, 'Fatura marcada como paga. Pendência removida.')}
                    className="w-full px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    Marcar como Paga
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-gray-400 dark:text-gray-500" style={{ fontSize: '11px', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div className="text-gray-900 dark:text-gray-100" style={{ fontSize: '14px', fontFamily: mono ? 'monospace' : undefined }}>{value}</div>
    </div>
  );
}
