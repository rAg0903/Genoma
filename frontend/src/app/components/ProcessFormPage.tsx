import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Save, User, Phone, MapPin, Baby, Syringe, Receipt, StickyNote, Paperclip,
  FileText, Package, Activity, Loader2, Lock, Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { Contact, Processo } from '../data/types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { filterMotivosPorContexto, getMotivoProcessoCancelHint } from '../../lib/motivos-anulacao';
import { apiRequest } from '../../lib/api';
import { getAuthToken } from '../../lib/api-processos';
import { ApiPaciente, mapApiPacienteToContact } from '../../lib/pacientes';
import { formatCalendarDatePt, todayLocal } from '../../lib/dates';
import {
  calcularDataPartoPrevista,
  calcularGestacaoAtual,
  formatDataPartoPt,
} from '../../lib/gestacao';
import {
  ProcessFormData,
  buildProcessSubmitPayload,
  processToFormData,
  validateProcessForm,
} from '../../lib/process-form';
import { Section, AnexosTab } from './ContactDetail';
import { ProcessResultadoTab } from './processos/ProcessResultadoTab';
import { ProcessFaturacaoFields } from './shared/ProcessFaturacaoFields';
import { FaturacaoAlertBanner } from './shared/FaturacaoAlertBanner';
import { extractFaturacaoFromProcesso } from '../../lib/process-form';

type TabId = 'identificacao' | 'gravidez' | 'colheita' | 'faturacao' | 'resultados' | 'kits' | 'notas' | 'anexos';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'gravidez', label: 'Gravidez', icon: Baby },
  { id: 'colheita', label: 'Colheita', icon: Syringe },
  { id: 'faturacao', label: 'Faturação', icon: Receipt },
  { id: 'resultados', label: 'Resultados', icon: FileText },
  { id: 'kits', label: 'Kits', icon: Package },
  { id: 'notas', label: 'Notas', icon: StickyNote },
  { id: 'anexos', label: 'Anexos', icon: Paperclip },
];

const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500';
const readOnlyClass = `${inputClass} bg-gray-50 dark:bg-gray-800/80 cursor-default focus:ring-0`;
const labelClass = 'block mb-1.5 text-gray-600 dark:text-gray-400';
const fmt = (value?: string) => formatCalendarDatePt(value);

const tipoGravidezLabel = (tipo?: 'singular' | 'gemelar' | null) =>
  tipo === 'gemelar' ? 'Gemelar' : tipo === 'singular' ? 'Singular' : '';

function ReadOnlyBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400" style={{ fontSize: '12px' }}>
      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
      Dados herdados do contacto — apenas leitura. Edite o contacto para alterar estes campos.
    </div>
  );
}

function ReadOnlyField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <label className={labelClass} style={{ fontSize: '13px' }}>{label}</label>
      <input
        readOnly
        value={value || ''}
        className={readOnlyClass}
        style={{ fontSize: '14px', fontFamily: mono ? 'monospace' : undefined }}
      />
    </div>
  );
}

export function ProcessFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    contacts, processos, updateProcesso, refreshProcessos, motivosAnulacao,
    getAnexosByPaciente, addAnexo, deleteAnexo,
  } = useData();
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const canUpdate = hasPermission('processos', 'update');

  const [tab, setTab] = useState<TabId>('identificacao');
  const [form, setForm] = useState<ProcessFormData | null>(null);
  const [paciente, setPaciente] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [anulacao, setAnulacao] = useState({ cancelado: false, motivo_anulacao_id: '' });

  const processo = id ? processos.find((p) => p.id === id) : undefined;
  const jaCancelado = processo?.estado === 'Cancelado';

  const motivosProcesso = useMemo(
    () => filterMotivosPorContexto(motivosAnulacao, 'processo'),
    [motivosAnulacao],
  );
  const motivoSelecionado = motivosProcesso.find((m) => m.id === anulacao.motivo_anulacao_id);
  const motivoCanceladoNome = processo?.motivo_anulacao_nome
    || motivosProcesso.find((m) => m.id === processo?.motivo_anulacao_id)?.nome
    || '';

  useEffect(() => {
    if (processo) setForm(processToFormData(processo));
  }, [processo]);

  useEffect(() => {
    if (!processo) return;
    setAnulacao({
      cancelado: processo.estado === 'Cancelado',
      motivo_anulacao_id: processo.motivo_anulacao_id || '',
    });
  }, [processo?.id, processo?.estado, processo?.motivo_anulacao_id]);

  useEffect(() => {
    if (!form?.paciente_id) {
      setPaciente(null);
      return;
    }
    const cached = contacts.find((c) => c.id === form.paciente_id);
    if (cached) {
      setPaciente(cached);
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    apiRequest<{ data: ApiPaciente }>(`/pacientes/${form.paciente_id}`, { token })
      .then((r) => { if (r?.data) setPaciente(mapApiPacienteToContact(r.data)); })
      .catch(() => setPaciente(null));
  }, [form?.paciente_id, contacts]);

  const gravidezCalculada = useMemo(() => {
    if (!form) return { gestacaoAtual: null, dataParto: null };
    const semanas = form.gestacao_semanas_registo ?? paciente?.gestacao_semanas_registo;
    const dias = form.gestacao_dias_registo ?? paciente?.gestacao_dias_registo ?? 0;
    const dataRegisto = form.gestacao_registada_em || paciente?.gestacao_registada_em || form.data_entrada || '';
    if (semanas == null || !dataRegisto) return { gestacaoAtual: null, dataParto: null };
    return {
      gestacaoAtual: calcularGestacaoAtual(semanas, dias, dataRegisto),
      dataParto: calcularDataPartoPrevista(semanas, dias, dataRegisto),
    };
  }, [form, paciente]);

  const handleGuardar = async () => {
    if (!processo || !form || !canUpdate) return;
    if (anulacao.cancelado && !anulacao.motivo_anulacao_id) {
      toast.error(t('pages.processes.form.cancelReasonRequired'));
      setTab('identificacao');
      return;
    }
    const formComEstado = {
      ...form,
      estado: anulacao.cancelado ? 'Cancelado' as const : form.estado,
      motivo_anulacao_id: anulacao.cancelado ? anulacao.motivo_anulacao_id : null,
    };
    const error = validateProcessForm(formComEstado, processos, processo.id);
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    try {
      await updateProcesso(processo.id, buildProcessSubmitPayload(formComEstado));
      toast.success(anulacao.cancelado ? 'Processo cancelado.' : 'Processo atualizado!');
      navigate(`/processos/${processo.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao guardar processo.');
    } finally {
      setSaving(false);
    }
  };

  if (!id || !processo || !form) {
    return (
      <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900 p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
        <button onClick={() => navigate('/processos')} className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar aos processos
        </button>
        <p className="text-gray-500 dark:text-gray-400">Processo não encontrado.</p>
      </div>
    );
  }

  const initials = (form.paciente_nome || form.numero).split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const pacienteNome = paciente?.nome || form.paciente_nome;

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/processos/${processo.id}`)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-teal-700 dark:text-teal-400" style={{ fontSize: '15px', fontWeight: 700 }}>{initials || 'PR'}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-gray-900 dark:text-gray-100 truncate font-mono" style={{ fontSize: '18px', fontWeight: 600 }}>{form.numero}</h1>
              <p className="text-gray-400 dark:text-gray-500 truncate" style={{ fontSize: '12px', marginTop: 2 }}>
                Edição de processo · {pacienteNome || 'Sem paciente'} · {form.estado}
              </p>
            </div>
          </div>
          {canUpdate && (
            <button onClick={handleGuardar} disabled={saving} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60 flex-shrink-0" style={{ fontSize: '13px', fontWeight: 500 }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">{saving ? 'A guardar…' : 'Guardar'}</span>
            </button>
          )}
        </div>

        <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${active ? 'bg-teal-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                style={{ fontSize: '13px', fontWeight: active ? 600 : 500 }}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="space-y-4 max-w-4xl">
          {form && jaCancelado && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200">
              <Ban className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">{t('pages.processes.form.cancelledBanner')}</p>
                <p className="text-xs mt-1 opacity-90">{t('pages.processes.form.cancelledBannerDetail')}</p>
                {motivoCanceladoNome && (
                  <p className="text-xs mt-2">Motivo: {motivoCanceladoNome}</p>
                )}
              </div>
            </div>
          )}
          {form && (
            <FaturacaoAlertBanner
              value={extractFaturacaoFromProcesso({ ...processo, ...form })}
              context="processo"
              onGoToFaturacao={() => setTab('faturacao')}
            />
          )}
          {tab === 'identificacao' && (
            <div className="space-y-4">
              <Section title="Processo" icon={FileText}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Nº Processo</label>
                    <input type="text" value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} className={inputClass} style={{ fontSize: '14px', fontFamily: 'monospace' }} disabled={!canUpdate} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Data de Entrada</label>
                    <input type="date" value={form.data_entrada} onChange={(e) => setForm({ ...form, data_entrada: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Estado</label>
                    <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as Processo['estado'] })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate || jaCancelado || anulacao.cancelado}>
                      <option value="Colheita Realizada">Colheita Realizada</option>
                      <option value="Enviado Laboratorio">Enviado Laboratorio</option>
                      <option value="Em Analise">Em Analise</option>
                      <option value="Resultado Disponivel">Resultado Disponivel</option>
                      <option value="Validado">Validado</option>
                      <option value="Faturado">Faturado</option>
                    </select>
                  </div>
                  <ReadOnlyField label="Paciente" value={pacienteNome} />
                </div>
              </Section>

              <ReadOnlyBanner />
              <Section title="Informação Pessoal" icon={User}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <ReadOnlyField label="Nome completo" value={paciente?.nome || form.paciente_nome} />
                  <ReadOnlyField label="Data de Nascimento" value={fmt(paciente?.data_nascimento)} />
                  <ReadOnlyField label="Género" value={paciente?.genero || ''} />
                  <ReadOnlyField label="NIF" value={paciente?.nif || ''} mono />
                  <ReadOnlyField label="Altura (cm)" value={paciente?.altura || ''} />
                  <ReadOnlyField label="Peso (kg)" value={paciente?.peso || ''} />
                </div>
              </Section>
              <Section title="Contacto" icon={Phone}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ReadOnlyField label="Telemóvel" value={paciente?.telemovel || ''} />
                  <ReadOnlyField label="Email" value={paciente?.email || ''} />
                </div>
              </Section>
              <Section title="Morada" icon={MapPin}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 md:col-span-3">
                    <ReadOnlyField label="Morada" value={paciente?.morada || ''} />
                  </div>
                  <ReadOnlyField label="Código Postal" value={paciente?.codigo_postal || ''} />
                  <ReadOnlyField label="Cidade" value={paciente?.cidade || ''} />
                  <ReadOnlyField label="Distrito" value={paciente?.distrito || ''} />
                  <ReadOnlyField label="País" value={paciente?.pais || ''} />
                </div>
              </Section>

              <Section title={jaCancelado ? t('pages.processes.form.cancelled') : t('pages.processes.form.cancelProcess')} icon={Ban}>
                <div className="space-y-3">
                  {jaCancelado ? (
                    <div className="max-w-md space-y-2">
                      <ReadOnlyField label={t('pages.processes.form.cancelReason')} value={motivoCanceladoNome || '—'} />
                      {processo.data_anulacao && (
                        <ReadOnlyField label="Data de cancelamento" value={fmt(processo.data_anulacao)} />
                      )}
                    </div>
                  ) : (
                    <>
                      <label className="inline-flex items-center gap-2.5 text-gray-700 dark:text-gray-300 cursor-pointer" style={{ fontSize: '14px' }}>
                        <input
                          type="checkbox"
                          checked={anulacao.cancelado}
                          onChange={(e) => setAnulacao({
                            cancelado: e.target.checked,
                            motivo_anulacao_id: e.target.checked ? anulacao.motivo_anulacao_id : '',
                          })}
                          disabled={!canUpdate}
                          className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                        />
                        <span style={{ fontWeight: 500 }}>{t('pages.processes.form.cancelProcess')}</span>
                      </label>

                      {anulacao.cancelado && (
                        <div className="pl-6 max-w-md space-y-2">
                          <label className={labelClass} style={{ fontSize: '13px' }}>
                            {t('pages.processes.form.cancelReason')} <span className="text-red-500">*</span>
                          </label>
                          <select
                            className={inputClass}
                            value={anulacao.motivo_anulacao_id}
                            onChange={(e) => setAnulacao({ ...anulacao, motivo_anulacao_id: e.target.value })}
                            disabled={!canUpdate}
                            style={{ fontSize: '14px' }}
                          >
                            <option value="">{t('pages.processes.form.selectCancelReason')}</option>
                            {motivosProcesso.map((m) => (
                              <option key={m.id} value={m.id}>{m.nome}</option>
                            ))}
                          </select>
                          {motivosProcesso.length === 0 && (
                            <p className="text-amber-600 dark:text-amber-400 text-xs">
                              Sem motivos configurados. Adicione em Administração → Motivos de anulação.
                            </p>
                          )}
                          {motivoSelecionado && (
                            <p className="text-gray-500 dark:text-gray-400 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2">
                              {getMotivoProcessoCancelHint(motivoSelecionado)}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Section>
            </div>
          )}

          {tab === 'gravidez' && (
            <Section title="Gravidez" icon={Baby}>
              <ReadOnlyBanner />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadOnlyField label="Médico" value={form.medico} />
                <ReadOnlyField label="Onde é seguida" value={form.onde_seguida || paciente?.onde_seguida || ''} />
                <ReadOnlyField
                  label="Tipo de gravidez"
                  value={tipoGravidezLabel(form.tipo_gravidez ?? paciente?.tipo_gravidez ?? null)}
                />
                {(form.gestacao_semanas_registo != null || paciente?.gestacao_semanas_registo != null) && (
                  <ReadOnlyField
                    label="Tempo de gestação (data registo)"
                    value={`${form.gestacao_semanas_registo ?? paciente?.gestacao_semanas_registo ?? 0} sem · ${form.gestacao_dias_registo ?? paciente?.gestacao_dias_registo ?? 0} dias`}
                  />
                )}
                {gravidezCalculada.gestacaoAtual && (
                  <ReadOnlyField
                    label="Tempo de gestação (actual)"
                    value={`${gravidezCalculada.gestacaoAtual.semanas} sem · ${gravidezCalculada.gestacaoAtual.dias} dias`}
                  />
                )}
                {gravidezCalculada.dataParto && (
                  <ReadOnlyField
                    label="Data prevista do parto"
                    value={formatDataPartoPt(gravidezCalculada.dataParto)}
                  />
                )}
              </div>
            </Section>
          )}

          {tab === 'colheita' && (
            <Section title="Colheita" icon={Syringe}>
              <ReadOnlyBanner />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadOnlyField label="Posto de Colheita" value={form.posto} />
                <ReadOnlyField label="Data Prevista da Colheita" value={fmt(form.data_colheita_prevista || paciente?.data_colheita_prevista)} />
                <ReadOnlyField label="Data Efetiva da Colheita" value={fmt(form.data_colheita)} />
              </div>
            </Section>
          )}

          {tab === 'faturacao' && (
            <Section title="Faturação" icon={Receipt}>
              <div className="max-w-3xl">
                <ProcessFaturacaoFields
                  value={form}
                  onChange={(fat) => setForm({ ...form, ...fat })}
                  canUpdate={canUpdate}
                />
              </div>
            </Section>
          )}

          {tab === 'resultados' && (
            <div className="space-y-4">
              <Section title="Ciclo laboratorial" icon={Activity}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Responsável de Fluxo</label>
                    <input type="text" value={form.responsavel_fluxo} onChange={(e) => setForm({ ...form, responsavel_fluxo: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Envio Relatório</label>
                    <select value={form.relatorio_enviado_para} onChange={(e) => setForm({ ...form, relatorio_enviado_para: e.target.value as Processo['relatorio_enviado_para'] })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate}>
                      <option value="Nenhum">Nenhum</option>
                      <option value="Medico">Médico</option>
                      <option value="Utente">Utente</option>
                      <option value="Ambos">Ambos</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Chegada ao Laboratório</label>
                    <input type="date" value={form.data_chegada_laboratorio} onChange={(e) => setForm({ ...form, data_chegada_laboratorio: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Data Resultado</label>
                    <input type="date" value={form.data_resultado} onChange={(e) => setForm({ ...form, data_resultado: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Data Validação</label>
                    <input type="date" value={form.data_validacao} onChange={(e) => setForm({ ...form, data_validacao: e.target.value, relatorio_validado: e.target.value ? true : form.relatorio_validado })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Data Envio Relatório</label>
                    <input type="date" value={form.data_envio_relatorio} onChange={(e) => setForm({ ...form, data_envio_relatorio: e.target.value })} className={inputClass} style={{ fontSize: '14px' }} disabled={!canUpdate} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Fração fetal (0–100%)</label>
                    <input type="text" value={form.fracao_fetal || ''} onChange={(e) => setForm({ ...form, fracao_fetal: e.target.value })} className={inputClass} placeholder="Ex.: 8.5%" style={{ fontSize: '14px' }} disabled={!canUpdate} />
                  </div>
                  <div className="flex items-end">
                    <label className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300" style={{ fontSize: '13px' }}>
                      <input type="checkbox" checked={!!form.relatorio_validado} onChange={(e) => setForm({ ...form, relatorio_validado: e.target.checked, data_validacao: e.target.checked && !form.data_validacao ? todayLocal() : form.data_validacao })} disabled={!canUpdate} />
                      Relatório validado
                    </label>
                  </div>
                </div>
              </Section>
              <Section title="Resultados genéticos" icon={FileText}>
                <ProcessResultadoTab
                  processo={processo}
                  canUpdate={canUpdate}
                  onChanged={() => { void refreshProcessos(); }}
                />
              </Section>
            </div>
          )}

          {tab === 'kits' && (
            <Section title="Kit associado" icon={Package}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ReadOnlyField label="Posto" value={form.posto} />
                <ReadOnlyField label="Teste" value={form.teste} />
                <ReadOnlyField label="Médico" value={form.medico} />
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Código de Barras do Kit</label>
                  <input
                    type="text"
                    value={form.kit_codigo}
                    onChange={(e) => setForm({ ...form, kit_codigo: e.target.value })}
                    className={inputClass}
                    placeholder="KIT-XXXX-XXXX"
                    style={{ fontSize: '14px', fontFamily: 'monospace' }}
                    disabled={!canUpdate}
                  />
                  <p className="text-gray-400 dark:text-gray-500 mt-1" style={{ fontSize: '11px' }}>Kit seleccionado na colheita do contacto. Editável apenas em casos excepcionais.</p>
                </div>
                <ReadOnlyField label="Data da Colheita" value={fmt(form.data_colheita)} />
              </div>
            </Section>
          )}

          {tab === 'notas' && (
            <Section title="Notas" icon={StickyNote}>
              <ReadOnlyBanner />
              <label className={labelClass} style={{ fontSize: '13px' }}>Notas internas (do contacto)</label>
              <textarea
                readOnly
                rows={6}
                value={form.observacoes || paciente?.notas_internas || ''}
                className={readOnlyClass}
                style={{ fontSize: '14px', resize: 'none' }}
              />
            </Section>
          )}

          {tab === 'anexos' && form.paciente_id && (
            <AnexosTab
              pacienteId={form.paciente_id}
              canUpdate={canUpdate}
              canDelete={canUpdate}
              getAnexos={getAnexosByPaciente}
              addAnexo={addAnexo}
              deleteAnexo={deleteAnexo}
            />
          )}
        </div>
      </div>
    </div>
  );
}
