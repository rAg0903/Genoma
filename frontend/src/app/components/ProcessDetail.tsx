import { ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Edit, Trash2, User, MapPin, Baby, Syringe, Receipt,
  StickyNote, Paperclip, FileText, Package, Activity, Save, Loader2, Ban,
} from 'lucide-react';
import { Contact, Processo } from '../data/types';
import { useData } from '../context/DataContext';
import { apiRequest } from '../../lib/api';
import { getAuthToken } from '../../lib/api-processos';
import { ApiPaciente, mapApiPacienteToContact } from '../../lib/pacientes';
import { formatCalendarDatePt } from '../../lib/dates';
import {
  calcularDataPartoPrevista,
  calcularGestacaoAtual,
  formatDataPartoPt,
} from '../../lib/gestacao';
import { ESTADO_LABEL } from '../../lib/processos';
import { AnexosTab, DetailDivider, DetailPanel, DetailSection, InfoField } from './ContactDetail';
import { ProcessResultadoTab } from './processos/ProcessResultadoTab';
import { ProcessFaturacaoView } from './shared/ProcessFaturacaoFields';
import { FaturacaoAlertBanner } from './shared/FaturacaoAlertBanner';
import { ProcessDataQualityBanner } from './shared/ProcessDataQualityBanner';
import { extractFaturacaoFromProcesso } from '../../lib/process-form';
import { StatusBadge } from './shared/StatusBadge';
import { PROCESS_STATUS_STYLES, ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';
import { CONTROL, FORM } from '../../lib/design-tokens';
import { FormAvatarInitials, FormPageBody, FormPageHeader, FormPageShell, FormPrimaryButton, FormTabContent } from './shared/FormPageChrome';
import { ProcessEditTabContent } from './processos/ProcessEditTabContent';
import { ProcessRecordEdit } from './processos/useProcessRecordEdit';
import { useLanguage } from '../../i18n/LanguageContext';
import { type ProcessTabId } from '../../lib/record-tabs';

interface ProcessDetailProps {
  processo: Processo;
  onBack: () => void;
  onEdit?: () => void;
  onCancelEdit?: () => void;
  onSave?: () => void;
  onDelete: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
  isEditing?: boolean;
  saving?: boolean;
  edit?: ProcessRecordEdit;
  topNotice?: ReactNode;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

type TabId = ProcessTabId;

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

const fmt = (value?: string | null) => formatCalendarDatePt(value);

const tipoGravidezLabel = (tipo?: 'singular' | 'gemelar' | null) =>
  tipo === 'gemelar' ? 'Gemelar' : tipo === 'singular' ? 'Singular' : '';

export function ProcessDetail({
  processo,
  onBack,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  canUpdate = true,
  canDelete = true,
  isEditing = false,
  saving = false,
  edit,
  topNotice,
  activeTab,
  onTabChange,
}: ProcessDetailProps) {
  const { contacts, getAnexosByPaciente, uploadAnexoFile, deleteAnexo, refreshProcessos } = useData();
  const { t } = useLanguage();
  const [internalTab, setInternalTab] = useState<TabId>('identificacao');
  const tab = activeTab ?? internalTab;
  const handleTabChange = onTabChange ?? setInternalTab;
  const [paciente, setPaciente] = useState<Contact | null>(null);

  useEffect(() => {
    if (!processo.paciente_id) {
      setPaciente(null);
      return;
    }
    const cached = contacts.find((c) => c.id === processo.paciente_id);
    if (cached) {
      setPaciente(cached);
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    apiRequest<{ data: ApiPaciente }>(`/pacientes/${processo.paciente_id}`, { token })
      .then((r) => { if (r?.data) setPaciente(mapApiPacienteToContact(r.data)); })
      .catch(() => setPaciente(null));
  }, [processo.paciente_id, contacts]);

  const gravidezCalculada = useMemo(() => {
    const semanas = processo.gestacao_semanas_registo ?? paciente?.gestacao_semanas_registo;
    const dias = processo.gestacao_dias_registo ?? paciente?.gestacao_dias_registo ?? 0;
    const dataRegisto = processo.gestacao_registada_em || paciente?.gestacao_registada_em || processo.data_entrada || '';
    if (semanas == null || !dataRegisto) return { gestacaoAtual: null, dataParto: null };
    return {
      gestacaoAtual: calcularGestacaoAtual(semanas, dias, dataRegisto),
      dataParto: calcularDataPartoPrevista(semanas, dias, dataRegisto),
    };
  }, [processo, paciente]);

  const pacienteNome = paciente?.nome || processo.paciente_nome;
  const initials = (pacienteNome || processo.numero).split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <FormPageShell>
      <FormPageBody>
        {topNotice}
        <FormPageHeader
          onBack={onBack}
          title={processo.numero}
          titleExtra={<StatusBadge status={processo.estado} map={PROCESS_STATUS_STYLES} className="flex-shrink-0" />}
          subtitle={`${pacienteNome || 'Sem paciente'} · ${processo.teste} · ${ESTADO_LABEL[processo.estado]}`}
          avatar={<FormAvatarInitials initials={initials || 'PR'} />}
          actions={(canUpdate || canDelete) ? (
            <>
              {isEditing ? (
                <>
                  <button type="button" onClick={onCancelEdit} className={CONTROL.buttonSecondary}>
                    Cancelar
                  </button>
                  {canUpdate && (
                    <FormPrimaryButton onClick={onSave} disabled={saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="hidden sm:inline">{saving ? 'A guardar…' : 'Guardar'}</span>
                    </FormPrimaryButton>
                  )}
                </>
              ) : (
                <>
                  {canUpdate && onEdit && (
                    <button type="button" onClick={onEdit} className={ADD_ACTION_BUTTON_CLASS}>
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={onDelete}
                      className={`${CONTROL.buttonSecondary} text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30`}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  )}
                </>
              )}
            </>
          ) : undefined}
          tabs={TABS}
          activeTab={tab}
          onTabChange={handleTabChange}
        />

        <FormTabContent>
          <div className="space-y-3">
            {isEditing && edit?.form && edit.jaCancelado ? (
              <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200/90">
                <Ban className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600 }}>{t('pages.processes.form.cancelledBanner')}</p>
                  <p className="mt-0.5 opacity-90" style={{ fontSize: '13px' }}>{t('pages.processes.form.cancelledBannerDetail')}</p>
                  {edit.motivoCanceladoNome && (
                    <p className="mt-2 opacity-90" style={{ fontSize: '13px' }}>Motivo: {edit.motivoCanceladoNome}</p>
                  )}
                </div>
              </div>
            ) : (
              <ProcessDataQualityBanner processo={processo} />
            )}
            <FaturacaoAlertBanner
              value={extractFaturacaoFromProcesso(
                isEditing && edit?.form ? { ...processo, ...edit.form } : processo,
              )}
              context="processo"
              onGoToFaturacao={() => handleTabChange('faturacao')}
            />
          </div>
        </FormTabContent>

        {isEditing && edit ? (
          <ProcessEditTabContent
            tab={tab}
            processo={processo}
            edit={edit}
            canUpdate={canUpdate}
            t={t}
          />
        ) : (
          <>
        {tab === 'identificacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Processo" icon={FileText}>
                <div className={FORM.fieldRow}>
                  <InfoField label="Nº Processo" value={processo.numero} mono width="lg" />
                  <InfoField label="Data de Entrada" value={fmt(processo.data_entrada)} width="sm" />
                  <InfoField label="Estado" value={ESTADO_LABEL[processo.estado]} width="md" />
                  <InfoField label="Paciente" value={pacienteNome || ''} width="2xl" />
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Dados do contacto" icon={User}>
                <div className={FORM.fieldRow}>
                  <InfoField label="Nome completo" value={paciente?.nome || processo.paciente_nome || ''} width="2xl" />
                  <InfoField label="Data de Nascimento" value={fmt(paciente?.data_nascimento)} width="sm" />
                  <InfoField label="Género" value={paciente?.genero || ''} width="md" />
                  <InfoField label="NIF" value={paciente?.nif || ''} mono width="md" />
                  <InfoField label="Telemóvel" value={paciente?.telemovel || ''} width="lg" />
                  <InfoField label="Email" value={paciente?.email || ''} width="xl" />
                  <InfoField label="Altura (cm)" value={paciente?.altura || ''} width="xs" />
                  <InfoField label="Peso (kg)" value={paciente?.peso || ''} width="xs" />
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Morada" icon={MapPin}>
                <div className={FORM.fieldRow}>
                  <InfoField label="Morada" value={paciente?.morada || ''} width="3xl" />
                  <InfoField label="Código Postal" value={paciente?.codigo_postal || ''} width="sm" />
                  <InfoField label="Cidade" value={paciente?.cidade || ''} width="lg" />
                  <InfoField label="Distrito" value={paciente?.distrito || ''} width="lg" />
                  <InfoField label="País" value={paciente?.pais || ''} width="md" />
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'gravidez' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Gravidez" icon={Baby}>
                <div className={FORM.fieldRow}>
                  <InfoField label="Médico" value={processo.medico} width="lg" />
                  <InfoField label="Onde é seguida" value={processo.onde_seguida || paciente?.onde_seguida || ''} width="3xl" />
                  <InfoField
                    label="Tipo de gravidez"
                    value={tipoGravidezLabel(processo.tipo_gravidez ?? paciente?.tipo_gravidez ?? null)}
                    width="md"
                  />
                  {(processo.gestacao_semanas_registo != null || paciente?.gestacao_semanas_registo != null) && (
                    <InfoField
                      label="Tempo de gestação (data registo)"
                      value={`${processo.gestacao_semanas_registo ?? paciente?.gestacao_semanas_registo ?? 0} sem · ${processo.gestacao_dias_registo ?? paciente?.gestacao_dias_registo ?? 0} dias`}
                      width="lg"
                    />
                  )}
                  {gravidezCalculada.gestacaoAtual && (
                    <InfoField
                      label="Tempo de gestação (actual)"
                      value={`${gravidezCalculada.gestacaoAtual.semanas} sem · ${gravidezCalculada.gestacaoAtual.dias} dias`}
                      width="lg"
                    />
                  )}
                  {gravidezCalculada.dataParto && (
                    <InfoField label="Data prevista do parto" value={formatDataPartoPt(gravidezCalculada.dataParto)} width="sm" />
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
                <div className={FORM.fieldRow}>
                  <InfoField label="Posto de Colheita" value={processo.posto} width="3xl" />
                  <InfoField label="Data Prevista da Colheita" value={fmt(processo.data_colheita_prevista || paciente?.data_colheita_prevista)} width="sm" />
                  <InfoField label="Data Efetiva da Colheita" value={fmt(processo.data_colheita)} width="sm" />
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'faturacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Faturação" icon={Receipt}>
                <ProcessFaturacaoView value={extractFaturacaoFromProcesso(processo)} />
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'resultados' && (
          <FormTabContent>
            <ProcessResultadoTab
              processo={processo}
              canUpdate={canUpdate}
              onChanged={() => { void refreshProcessos(); }}
              variant="page"
            />
          </FormTabContent>
        )}

        {tab === 'kits' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Kit associado" icon={Package}>
                <div className={FORM.fieldRow}>
                  <InfoField label="Posto" value={processo.posto} width="lg" />
                  <InfoField label="Teste" value={processo.teste} width="lg" />
                  <InfoField label="Médico" value={processo.medico} width="lg" />
                  <InfoField label="Código de Barras do Kit" value={processo.kit_codigo || ''} mono width="lg" />
                  <InfoField label="Data da Colheita" value={fmt(processo.data_colheita)} width="sm" />
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'notas' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Notas" icon={StickyNote}>
                <InfoField label="Notas internas" value={processo.observacoes || paciente?.notas_internas || ''} width="3xl" />
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'anexos' && processo.paciente_id && (
          <FormTabContent className="space-y-4">
            <AnexosTab
              pacienteId={processo.paciente_id}
              processoId={processo.id}
              canUpdate={false}
              canDelete={false}
              getAnexos={getAnexosByPaciente}
              uploadAnexoFile={uploadAnexoFile}
              deleteAnexo={deleteAnexo}
            />
          </FormTabContent>
        )}
          </>
        )}
      </FormPageBody>
    </FormPageShell>
  );
}
