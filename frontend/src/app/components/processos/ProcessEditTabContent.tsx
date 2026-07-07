import { useMemo } from 'react';
import {
  User, MapPin, Baby, Syringe, Receipt, StickyNote,
  FileText, Package, Activity, Ban,
} from 'lucide-react';
import { Processo } from '../../data/types';
import { useData } from '../../context/DataContext';
import { formatCalendarDatePt, todayLocal } from '../../../lib/dates';
import {
  calcularDataPartoPrevista,
  calcularGestacaoAtual,
  formatDataPartoPt,
} from '../../../lib/gestacao';
import { getMotivoProcessoCancelHint } from '../../../lib/motivos-anulacao';
import { ProcessFormData } from '../../../lib/process-form';
import { type ProcessTabId } from '../../../lib/record-tabs';
import { AnexosTab, DetailDivider, DetailPanel, DetailSection } from '../ContactDetail';
import { ProcessResultadoTab } from './ProcessResultadoTab';
import { ProcessFaturacaoFields } from '../shared/ProcessFaturacaoFields';
import {
  FormField,
  FormInput,
  FormRadixSelect,
  FormReadOnlyInput,
  FormSectionNote,
  FormTabContent,
  FormTextarea,
} from '../shared/FormPageChrome';
import { FormDatePicker } from '../shared/FormDatePicker';
import { CHECKBOX_INPUT_CLASS } from '../../../lib/design-system';
import { FORM } from '../../../lib/design-tokens';
import { ProcessRecordEdit } from './useProcessRecordEdit';

type Props = {
  tab: ProcessTabId;
  processo: Processo;
  edit: ProcessRecordEdit;
  canUpdate: boolean;
  t: (key: string) => string;
};

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

export function ProcessEditTabContent({ tab, processo, edit, canUpdate, t }: Props) {
  const { getAnexosByPaciente, uploadAnexoFile, deleteAnexo } = useData();
  const {
    form, setForm, paciente, anulacao, setAnulacao,
    jaCancelado, motivosProcesso, motivoSelecionado, motivoCanceladoNome, refreshProcessos,
  } = edit;

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

  if (!form) return null;

  const pacienteNome = paciente?.nome || form.paciente_nome;
  const updateForm = (patch: Partial<ProcessFormData>) => setForm({ ...form, ...patch });

  if (tab === 'identificacao') {
    return (
      <FormTabContent>
        <DetailPanel>
          <DetailSection title="Processo" icon={FileText}>
            <div className={FORM.fieldRow}>
              <FormField label="Nº Processo" width="lg">
                <FormInput
                  className="font-mono tabular-nums"
                  value={form.numero}
                  onChange={(e) => updateForm({ numero: e.target.value })}
                  disabled={!canUpdate}
                />
              </FormField>
              <FormField label="Data de Entrada" width="sm">
                <FormDatePicker
                  value={form.data_entrada}
                  onChange={(v) => updateForm({ data_entrada: v })}
                  disabled={!canUpdate}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>
              <FormField label="Estado" width="md">
                <FormRadixSelect
                  value={form.estado}
                  onChange={(v) => updateForm({ estado: v as Processo['estado'] })}
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
    );
  }

  if (tab === 'gravidez') {
    return (
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
    );
  }

  if (tab === 'colheita') {
    return (
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
    );
  }

  if (tab === 'faturacao') {
    return (
      <FormTabContent>
        <DetailPanel>
          <DetailSection title="Faturação" icon={Receipt}>
            <ProcessFaturacaoFields
              value={form}
              onChange={(fat) => updateForm(fat)}
              canUpdate={canUpdate}
            />
          </DetailSection>
        </DetailPanel>
      </FormTabContent>
    );
  }

  if (tab === 'resultados') {
    return (
      <FormTabContent className="space-y-4">
        <DetailPanel>
          <DetailSection title="Ciclo laboratorial" icon={Activity}>
            <div className={FORM.fieldRow}>
              <FormField label="Responsável de Fluxo" width="lg">
                <FormInput
                  value={form.responsavel_fluxo}
                  onChange={(e) => updateForm({ responsavel_fluxo: e.target.value })}
                  disabled={!canUpdate}
                />
              </FormField>
              <FormField label="Envio Relatório" width="md">
                <FormRadixSelect
                  value={form.relatorio_enviado_para}
                  onChange={(v) => updateForm({ relatorio_enviado_para: v as Processo['relatorio_enviado_para'] })}
                  disabled={!canUpdate}
                  options={RELATORIO_ENVIO_OPTIONS}
                />
              </FormField>
              <FormField label="Chegada ao Laboratório" width="sm">
                <FormDatePicker
                  value={form.data_chegada_laboratorio}
                  onChange={(v) => updateForm({ data_chegada_laboratorio: v })}
                  disabled={!canUpdate}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>
              <FormField label="Data Resultado" width="sm">
                <FormDatePicker
                  value={form.data_resultado}
                  onChange={(v) => updateForm({ data_resultado: v })}
                  disabled={!canUpdate}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>
              <FormField label="Data Validação" width="sm">
                <FormDatePicker
                  value={form.data_validacao}
                  onChange={(v) => updateForm({
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
                  onChange={(v) => updateForm({ data_envio_relatorio: v })}
                  disabled={!canUpdate}
                  placeholder="dd/mm/aaaa"
                />
              </FormField>
              <FormField label="Fração fetal (0–100%)" width="sm">
                <FormInput
                  value={form.fracao_fetal || ''}
                  onChange={(e) => updateForm({ fracao_fetal: e.target.value })}
                  placeholder="Ex.: 8.5%"
                  disabled={!canUpdate}
                />
              </FormField>
              <FormField label="Relatório validado" width="md" controlClassName="flex items-center">
                <label className={`${FORM.checkboxRow} inline-flex`}>
                  <input
                    type="checkbox"
                    checked={!!form.relatorio_validado}
                    onChange={(e) => updateForm({
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
    );
  }

  if (tab === 'kits') {
    return (
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
                  onChange={(e) => updateForm({ kit_codigo: e.target.value })}
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
    );
  }

  if (tab === 'notas') {
    return (
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
    );
  }

  if (tab === 'anexos' && form.paciente_id) {
    return (
      <FormTabContent className="space-y-4">
        <AnexosTab
          pacienteId={form.paciente_id}
          processoId={processo.id}
          canUpdate={canUpdate}
          canDelete={canUpdate}
          getAnexos={getAnexosByPaciente}
          uploadAnexoFile={uploadAnexoFile}
          deleteAnexo={deleteAnexo}
        />
      </FormTabContent>
    );
  }

  return null;
}
