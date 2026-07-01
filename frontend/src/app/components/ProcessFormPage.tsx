import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  ArrowLeft, Save, User, MapPin, Baby, Syringe, Receipt, StickyNote, Paperclip,
  FileText, Package, Activity, Loader2, Ban,
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
import { AnexosTab, DetailDivider, DetailPanel, DetailSection } from './ContactDetail';
import { ProcessResultadoTab } from './processos/ProcessResultadoTab';
import { ProcessFaturacaoFields } from './shared/ProcessFaturacaoFields';
import { FaturacaoAlertBanner } from './shared/FaturacaoAlertBanner';
import {
  FormAvatarInitials,
  FormField,
  FormInput,
  FormPageBody,
  FormPageHeader,
  FormPageShell,
  FormPrimaryButton,
  FormRadixSelect,
  FormReadOnlyInput,
  FormSectionNote,
  FormTabContent,
  FormTextarea,
} from './shared/FormPageChrome';
import { FormDatePicker } from './shared/FormDatePicker';
import { extractFaturacaoFromProcesso } from '../../lib/process-form';
import { CHECKBOX_INPUT_CLASS } from '../../lib/design-system';
import { FORM } from '../../lib/design-tokens';

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

const fmt = (value?: string) => formatCalendarDatePt(value);

const tipoGravidezLabel = (tipo?: 'singular' | 'gemelar' | null) =>
  tipo === 'gemelar' ? 'Gemelar' : tipo === 'singular' ? 'Singular' : '';

const ESTADO_OPTIONS: { value: Processo['estado']; label: string }[] = [
  { value: 'Colheita Realizada', label: 'Colheita Realizada' },
  { value: 'Enviado Laboratorio', label: 'Enviado Laboratorio' },
  { value: 'Em Analise', label: 'Em Analise' },
  { value: 'Resultado Disponivel', label: 'Resultado Disponivel' },
  { value: 'Validado', label: 'Validado' },
  { value: 'Faturado', label: 'Faturado' },
];

const RELATORIO_ENVIO_OPTIONS: { value: Processo['relatorio_enviado_para']; label: string }[] = [
  { value: 'Nenhum', label: 'Nenhum' },
  { value: 'Medico', label: 'Médico' },
  { value: 'Utente', label: 'Utente' },
  { value: 'Ambos', label: 'Ambos' },
];

const PROCESS_TAB_IDS = new Set<TabId>(TABS.map((t) => t.id));

export function ProcessFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    contacts, processos, updateProcesso, refreshProcessos, motivosAnulacao,
    getAnexosByPaciente, addAnexo, deleteAnexo,
  } = useData();
  const { hasPermission } = useAuth();
  const { t } = useLanguage();
  const canUpdate = hasPermission('processos', 'update');

  const [tab, setTab] = useState<TabId>('identificacao');

  useEffect(() => {
    const requested = searchParams.get('tab');
    if (requested && PROCESS_TAB_IDS.has(requested as TabId)) {
      setTab(requested as TabId);
    }
  }, [searchParams]);

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
    <FormPageShell>
      <FormPageBody>
        <FormPageHeader
          onBack={() => navigate(`/processos/${processo.id}`)}
          title={form.numero}
          subtitle={`Edição de processo · ${pacienteNome || 'Sem paciente'} · ${form.estado}`}
          avatar={<FormAvatarInitials initials={initials || 'PR'} />}
          actions={canUpdate ? (
            <FormPrimaryButton onClick={handleGuardar} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">{saving ? 'A guardar…' : 'Guardar'}</span>
            </FormPrimaryButton>
          ) : undefined}
          tabs={TABS}
          activeTab={tab}
          onTabChange={setTab}
        />

        <FormTabContent>
          {form && jaCancelado ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200/90">
              <Ban className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600 }}>{t('pages.processes.form.cancelledBanner')}</p>
                <p className="mt-0.5 opacity-90" style={{ fontSize: '13px' }}>{t('pages.processes.form.cancelledBannerDetail')}</p>
                {motivoCanceladoNome && (
                  <p className="mt-2 opacity-90" style={{ fontSize: '13px' }}>Motivo: {motivoCanceladoNome}</p>
                )}
              </div>
            </div>
          ) : form ? (
            <FaturacaoAlertBanner
              value={extractFaturacaoFromProcesso({ ...processo, ...form })}
              context="processo"
              onGoToFaturacao={() => setTab('faturacao')}
            />
          ) : null}
        </FormTabContent>

        {tab === 'identificacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Processo" icon={FileText}>
                <div className={FORM.fieldRow}>
                  <FormField label="Nº Processo" width="lg">
                    <FormInput
                      className="font-mono tabular-nums"
                      value={form.numero}
                      onChange={(e) => setForm({ ...form, numero: e.target.value })}
                      disabled={!canUpdate}
                    />
                  </FormField>
                  <FormField label="Data de Entrada" width="sm">
                    <FormDatePicker
                      value={form.data_entrada}
                      onChange={(v) => setForm({ ...form, data_entrada: v })}
                      disabled={!canUpdate}
                      placeholder="dd/mm/aaaa"
                    />
                  </FormField>
                  <FormField label="Estado" width="md">
                    <FormRadixSelect
                      value={form.estado}
                      onChange={(v) => setForm({ ...form, estado: v as Processo['estado'] })}
                      disabled={!canUpdate || jaCancelado || anulacao.cancelado}
                      options={ESTADO_OPTIONS}
                    />
                  </FormField>
                  <FormField label="Paciente" width="2xl">
                    <FormReadOnlyInput value={pacienteNome || ''} />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Dados do contacto" icon={User}>
                <FormSectionNote>
                  Dados definidos na colheita do contacto — apenas leitura. Não são alterados ao guardar o processo.
                </FormSectionNote>
                <div className={`${FORM.fieldRow} mt-4`}>
                  <FormField label="Nome completo" width="2xl">
                    <FormReadOnlyInput value={paciente?.nome || form.paciente_nome || ''} />
                  </FormField>
                  <FormField label="Data de Nascimento" width="sm">
                    <FormReadOnlyInput value={fmt(paciente?.data_nascimento)} />
                  </FormField>
                  <FormField label="Género" width="md">
                    <FormReadOnlyInput value={paciente?.genero || ''} />
                  </FormField>
                  <FormField label="NIF" width="md">
                    <FormReadOnlyInput value={paciente?.nif || ''} mono />
                  </FormField>
                  <FormField label="Telemóvel" width="lg">
                    <FormReadOnlyInput value={paciente?.telemovel || ''} />
                  </FormField>
                  <FormField label="Email" width="xl">
                    <FormReadOnlyInput value={paciente?.email || ''} />
                  </FormField>
                  <FormField label="Altura (cm)" width="xs">
                    <FormReadOnlyInput value={paciente?.altura || ''} />
                  </FormField>
                  <FormField label="Peso (kg)" width="xs">
                    <FormReadOnlyInput value={paciente?.peso || ''} />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Morada" icon={MapPin}>
                <div className={FORM.fieldRow}>
                  <FormField label="Morada" width="3xl">
                    <FormReadOnlyInput value={paciente?.morada || ''} />
                  </FormField>
                  <FormField label="Código Postal" width="sm">
                    <FormReadOnlyInput value={paciente?.codigo_postal || ''} />
                  </FormField>
                  <FormField label="Cidade" width="lg">
                    <FormReadOnlyInput value={paciente?.cidade || ''} />
                  </FormField>
                  <FormField label="Distrito" width="lg">
                    <FormReadOnlyInput value={paciente?.distrito || ''} />
                  </FormField>
                  <FormField label="País" width="md">
                    <FormReadOnlyInput value={paciente?.pais || ''} />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title={jaCancelado ? t('pages.processes.form.cancelled') : t('pages.processes.form.cancelProcess')} icon={Ban}>
                <div className="space-y-3">
                  {jaCancelado ? (
                    <div className={FORM.fieldRow}>
                      <FormField label={t('pages.processes.form.cancelReason')} width="2xl">
                        <FormReadOnlyInput value={motivoCanceladoNome || '—'} />
                      </FormField>
                      {processo.data_anulacao && (
                        <FormField label="Data de cancelamento" width="sm">
                          <FormReadOnlyInput value={fmt(processo.data_anulacao)} />
                        </FormField>
                      )}
                    </div>
                  ) : (
                    <>
                      <label className={`${FORM.checkboxRow} inline-flex`}>
                        <input
                          type="checkbox"
                          checked={anulacao.cancelado}
                          onChange={(e) => setAnulacao({
                            cancelado: e.target.checked,
                            motivo_anulacao_id: e.target.checked ? anulacao.motivo_anulacao_id : '',
                          })}
                          disabled={!canUpdate}
                          className={CHECKBOX_INPUT_CLASS}
                        />
                        <span>{t('pages.processes.form.cancelProcess')}</span>
                      </label>

                      {anulacao.cancelado && (
                        <div className="max-w-md space-y-2">
                          <FormField label={t('pages.processes.form.cancelReason')} required width="full">
                            <FormRadixSelect
                              value={anulacao.motivo_anulacao_id}
                              onChange={(v) => setAnulacao({ ...anulacao, motivo_anulacao_id: v })}
                              disabled={!canUpdate}
                              placeholder={t('pages.processes.form.selectCancelReason')}
                              options={motivosProcesso.map((m) => ({ value: m.id, label: m.nome }))}
                            />
                          </FormField>
                          {motivosProcesso.length === 0 && (
                            <p className="text-amber-600 dark:text-amber-400 text-xs">
                              Sem motivos configurados. Adicione em Administração → Motivos de anulação.
                            </p>
                          )}
                          {motivoSelecionado && (
                            <p className="text-slate-500 dark:text-slate-400 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 px-3 py-2">
                              {getMotivoProcessoCancelHint(motivoSelecionado)}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'gravidez' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Gravidez" icon={Baby}>
                <FormSectionNote>
                  Dados definidos na colheita do contacto — apenas leitura. Não são alterados ao guardar o processo.
                </FormSectionNote>
                <div className={`${FORM.fieldRow} mt-4`}>
                  <FormField label="Médico" width="lg">
                    <FormReadOnlyInput value={form.medico} />
                  </FormField>
                  <FormField label="Onde é seguida" width="3xl">
                    <FormReadOnlyInput value={form.onde_seguida || paciente?.onde_seguida || ''} />
                  </FormField>
                  <FormField label="Tipo de gravidez" width="md">
                    <FormReadOnlyInput value={tipoGravidezLabel(form.tipo_gravidez ?? paciente?.tipo_gravidez ?? null)} />
                  </FormField>
                  {(form.gestacao_semanas_registo != null || paciente?.gestacao_semanas_registo != null) && (
                    <FormField label="Tempo de gestação (data registo)" width="lg">
                      <FormReadOnlyInput
                        value={`${form.gestacao_semanas_registo ?? paciente?.gestacao_semanas_registo ?? 0} sem · ${form.gestacao_dias_registo ?? paciente?.gestacao_dias_registo ?? 0} dias`}
                      />
                    </FormField>
                  )}
                  {gravidezCalculada.gestacaoAtual && (
                    <FormField label="Tempo de gestação (actual)" width="lg">
                      <FormReadOnlyInput
                        value={`${gravidezCalculada.gestacaoAtual.semanas} sem · ${gravidezCalculada.gestacaoAtual.dias} dias`}
                      />
                    </FormField>
                  )}
                  {gravidezCalculada.dataParto && (
                    <FormField label="Data prevista do parto" width="sm">
                      <FormReadOnlyInput value={formatDataPartoPt(gravidezCalculada.dataParto)} />
                    </FormField>
                  )}
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'colheita' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Colheita" icon={Syringe}>
                <FormSectionNote>
                  Dados definidos na colheita do contacto — apenas leitura. Não são alterados ao guardar o processo.
                </FormSectionNote>
                <div className={`${FORM.fieldRow} mt-4`}>
                  <FormField label="Posto de Colheita" width="3xl">
                    <FormReadOnlyInput value={form.posto} />
                  </FormField>
                  <FormField label="Data Prevista da Colheita" width="sm">
                    <FormReadOnlyInput value={fmt(form.data_colheita_prevista || paciente?.data_colheita_prevista)} />
                  </FormField>
                  <FormField label="Data Efetiva da Colheita" width="sm">
                    <FormReadOnlyInput value={fmt(form.data_colheita)} />
                  </FormField>
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'faturacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Faturação" icon={Receipt}>
                <ProcessFaturacaoFields
                  value={form}
                  onChange={(fat) => setForm({ ...form, ...fat })}
                  canUpdate={canUpdate}
                />
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'resultados' && (
          <FormTabContent className="space-y-4">
            <DetailPanel>
              <DetailSection title="Ciclo laboratorial" icon={Activity}>
                <div className={FORM.fieldRow}>
                  <FormField label="Responsável de Fluxo" width="lg">
                    <FormInput
                      value={form.responsavel_fluxo}
                      onChange={(e) => setForm({ ...form, responsavel_fluxo: e.target.value })}
                      disabled={!canUpdate}
                    />
                  </FormField>
                  <FormField label="Envio Relatório" width="md">
                    <FormRadixSelect
                      value={form.relatorio_enviado_para}
                      onChange={(v) => setForm({ ...form, relatorio_enviado_para: v as Processo['relatorio_enviado_para'] })}
                      disabled={!canUpdate}
                      options={RELATORIO_ENVIO_OPTIONS}
                    />
                  </FormField>
                  <FormField label="Chegada ao Laboratório" width="sm">
                    <FormDatePicker
                      value={form.data_chegada_laboratorio}
                      onChange={(v) => setForm({ ...form, data_chegada_laboratorio: v })}
                      disabled={!canUpdate}
                      placeholder="dd/mm/aaaa"
                    />
                  </FormField>
                  <FormField label="Data Resultado" width="sm">
                    <FormDatePicker
                      value={form.data_resultado}
                      onChange={(v) => setForm({ ...form, data_resultado: v })}
                      disabled={!canUpdate}
                      placeholder="dd/mm/aaaa"
                    />
                  </FormField>
                  <FormField label="Data Validação" width="sm">
                    <FormDatePicker
                      value={form.data_validacao}
                      onChange={(v) => setForm({
                        ...form,
                        data_validacao: v,
                        relatorio_validado: v ? true : form.relatorio_validado,
                      })}
                      disabled={!canUpdate}
                      placeholder="dd/mm/aaaa"
                    />
                  </FormField>
                  <FormField label="Data Envio Relatório" width="sm">
                    <FormDatePicker
                      value={form.data_envio_relatorio}
                      onChange={(v) => setForm({ ...form, data_envio_relatorio: v })}
                      disabled={!canUpdate}
                      placeholder="dd/mm/aaaa"
                    />
                  </FormField>
                  <FormField label="Fração fetal (0–100%)" width="sm">
                    <FormInput
                      value={form.fracao_fetal || ''}
                      onChange={(e) => setForm({ ...form, fracao_fetal: e.target.value })}
                      placeholder="Ex.: 8.5%"
                      disabled={!canUpdate}
                    />
                  </FormField>
                  <FormField label="Relatório validado" width="md">
                    <label className={`${FORM.checkboxRow} inline-flex mt-1.5`}>
                      <input
                        type="checkbox"
                        checked={!!form.relatorio_validado}
                        onChange={(e) => setForm({
                          ...form,
                          relatorio_validado: e.target.checked,
                          data_validacao: e.target.checked && !form.data_validacao ? todayLocal() : form.data_validacao,
                        })}
                        disabled={!canUpdate}
                        className={CHECKBOX_INPUT_CLASS}
                      />
                      <span>Relatório validado</span>
                    </label>
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Resultados genéticos" icon={FileText}>
                <ProcessResultadoTab
                  processo={processo}
                  canUpdate={canUpdate}
                  onChanged={() => { void refreshProcessos(); }}
                />
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'kits' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Kit associado" icon={Package}>
                <div className={FORM.fieldRow}>
                  <FormField label="Posto" width="lg">
                    <FormReadOnlyInput value={form.posto} />
                  </FormField>
                  <FormField label="Teste" width="lg">
                    <FormReadOnlyInput value={form.teste} />
                  </FormField>
                  <FormField label="Médico" width="lg">
                    <FormReadOnlyInput value={form.medico} />
                  </FormField>
                  <FormField
                    label="Código de Barras do Kit"
                    width="lg"
                    hint="Kit seleccionado na colheita do contacto. Editável apenas em casos excepcionais."
                  >
                    <FormInput
                      className="font-mono tabular-nums"
                      value={form.kit_codigo}
                      onChange={(e) => setForm({ ...form, kit_codigo: e.target.value })}
                      placeholder="KIT-XXXX-XXXX"
                      disabled={!canUpdate}
                    />
                  </FormField>
                  <FormField label="Data da Colheita" width="sm">
                    <FormReadOnlyInput value={fmt(form.data_colheita)} />
                  </FormField>
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'notas' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Notas" icon={StickyNote}>
                <FormSectionNote>
                  Dados definidos na colheita do contacto — apenas leitura. Não são alterados ao guardar o processo.
                </FormSectionNote>
                <FormField label="Notas internas (do contacto)" width="3xl" className="mt-4">
                  <FormTextarea
                    readOnly
                    disabled
                    rows={6}
                    value={form.observacoes || paciente?.notas_internas || ''}
                    className="resize-none"
                  />
                </FormField>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'anexos' && form.paciente_id && (
          <FormTabContent className="space-y-4">
            <AnexosTab
              pacienteId={form.paciente_id}
              canUpdate={canUpdate}
              canDelete={canUpdate}
              getAnexos={getAnexosByPaciente}
              addAnexo={addAnexo}
              deleteAnexo={deleteAnexo}
            />
          </FormTabContent>
        )}
      </FormPageBody>
    </FormPageShell>
  );
}
