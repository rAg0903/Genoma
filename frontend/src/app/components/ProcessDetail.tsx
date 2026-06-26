import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Edit, Trash2, User, Phone, MapPin, Baby, Syringe, Receipt,
  StickyNote, Paperclip, FileText, Package, Activity,
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
import { Section, InfoField, AnexosTab } from './ContactDetail';
import { ProcessResultadoTab } from './processos/ProcessResultadoTab';
import { ProcessFaturacaoView } from './shared/ProcessFaturacaoFields';
import { FaturacaoAlertBanner } from './shared/FaturacaoAlertBanner';
import { extractFaturacaoFromProcesso } from '../../lib/process-form';
import { StatusBadge } from './shared/StatusBadge';
import { PROCESS_STATUS_STYLES } from '../../lib/design-system';

interface ProcessDetailProps {
  processo: Processo;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

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

const fmt = (value?: string | null) => formatCalendarDatePt(value);

const tipoGravidezLabel = (tipo?: 'singular' | 'gemelar' | null) =>
  tipo === 'gemelar' ? 'Gemelar' : tipo === 'singular' ? 'Singular' : '';

export function ProcessDetail({
  processo,
  onBack,
  onEdit,
  onDelete,
  canUpdate = true,
  canDelete = true,
}: ProcessDetailProps) {
  const { contacts, getAnexosByPaciente, addAnexo, deleteAnexo } = useData();
  const [tab, setTab] = useState<TabId>('identificacao');
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
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-teal-700 dark:text-teal-400" style={{ fontSize: '15px', fontWeight: 700 }}>{initials || 'PR'}</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-gray-900 dark:text-gray-100 truncate font-mono" style={{ fontSize: '18px', fontWeight: 600 }}>{processo.numero}</h1>
                <StatusBadge status={processo.estado} map={PROCESS_STATUS_STYLES} className="flex-shrink-0" />
              </div>
              <p className="text-gray-400 dark:text-gray-500 truncate" style={{ fontSize: '12px', marginTop: 2 }}>
                {pacienteNome || 'Sem paciente'} · {processo.teste} · {ESTADO_LABEL[processo.estado]}
              </p>
            </div>
          </div>
          {(canUpdate || canDelete) && (
            <div className="flex gap-2 flex-shrink-0">
              {canUpdate && (
                <button onClick={onEdit} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm" style={{ fontSize: '13px', fontWeight: 500 }}>
                  <Edit className="w-4 h-4" /> <span className="hidden sm:inline">Editar</span>
                </button>
              )}
              {canDelete && (
                <button onClick={onDelete} className="flex items-center gap-2 px-3 md:px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" style={{ fontSize: '13px', fontWeight: 500 }}>
                  <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Eliminar</span>
                </button>
              )}
            </div>
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
          <FaturacaoAlertBanner
            value={extractFaturacaoFromProcesso(processo)}
            context="processo"
            onGoToFaturacao={() => setTab('faturacao')}
          />
          {tab === 'identificacao' && (
            <div className="space-y-4">
              <Section title="Processo" icon={FileText}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="Nº Processo" value={processo.numero} mono />
                  <InfoField label="Data de Entrada" value={fmt(processo.data_entrada)} />
                  <InfoField label="Estado" value={ESTADO_LABEL[processo.estado]} />
                  <InfoField label="Paciente" value={pacienteNome} />
                </div>
              </Section>
              <Section title="Informação Pessoal" icon={User}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="Nome completo" value={paciente?.nome || processo.paciente_nome} />
                  <InfoField label="Data de Nascimento" value={fmt(paciente?.data_nascimento)} />
                  <InfoField label="Género" value={paciente?.genero || ''} />
                  <InfoField label="NIF" value={paciente?.nif || ''} mono />
                  <InfoField label="Altura (cm)" value={paciente?.altura || ''} />
                  <InfoField label="Peso (kg)" value={paciente?.peso || ''} />
                </div>
              </Section>
              <Section title="Contacto" icon={Phone}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoField label="Telemóvel" value={paciente?.telemovel || ''} />
                  <InfoField label="Email" value={paciente?.email || ''} />
                </div>
              </Section>
              <Section title="Morada" icon={MapPin}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 md:col-span-3">
                    <InfoField label="Morada" value={paciente?.morada || ''} />
                  </div>
                  <InfoField label="Código Postal" value={paciente?.codigo_postal || ''} />
                  <InfoField label="Cidade" value={paciente?.cidade || ''} />
                  <InfoField label="Distrito" value={paciente?.distrito || ''} />
                  <InfoField label="País" value={paciente?.pais || ''} />
                </div>
              </Section>
            </div>
          )}

          {tab === 'gravidez' && (
            <Section title="Gravidez" icon={Baby}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <InfoField label="Médico" value={processo.medico} />
                <InfoField label="Onde é seguida" value={processo.onde_seguida || paciente?.onde_seguida || ''} />
                <InfoField
                  label="Tipo de gravidez"
                  value={tipoGravidezLabel(processo.tipo_gravidez ?? paciente?.tipo_gravidez ?? null)}
                />
                {(processo.gestacao_semanas_registo != null || paciente?.gestacao_semanas_registo != null) && (
                  <InfoField
                    label="Tempo de gestação (data registo)"
                    value={`${processo.gestacao_semanas_registo ?? paciente?.gestacao_semanas_registo ?? 0} sem · ${processo.gestacao_dias_registo ?? paciente?.gestacao_dias_registo ?? 0} dias`}
                  />
                )}
                {gravidezCalculada.gestacaoAtual && (
                  <InfoField
                    label="Tempo de gestação (actual)"
                    value={`${gravidezCalculada.gestacaoAtual.semanas} sem · ${gravidezCalculada.gestacaoAtual.dias} dias`}
                  />
                )}
                {gravidezCalculada.dataParto && (
                  <InfoField label="Data prevista do parto" value={formatDataPartoPt(gravidezCalculada.dataParto)} />
                )}
              </div>
            </Section>
          )}

          {tab === 'colheita' && (
            <Section title="Colheita" icon={Syringe}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <InfoField label="Posto de Colheita" value={processo.posto} />
                <InfoField label="Data Prevista da Colheita" value={fmt(processo.data_colheita_prevista || paciente?.data_colheita_prevista)} />
                <InfoField label="Data Efetiva da Colheita" value={fmt(processo.data_colheita)} />
              </div>
            </Section>
          )}

          {tab === 'faturacao' && (
            <Section title="Faturação" icon={Receipt}>
              <ProcessFaturacaoView value={extractFaturacaoFromProcesso(processo)} />
            </Section>
          )}

          {tab === 'resultados' && (
            <div className="space-y-4">
              <Section title="Ciclo laboratorial" icon={Activity}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="Responsável de Fluxo" value={processo.responsavel_fluxo || ''} />
                  <InfoField label="Envio Relatório" value={processo.relatorio_enviado_para || 'Nenhum'} />
                  <InfoField label="Chegada ao Laboratório" value={fmt(processo.data_chegada_laboratorio)} />
                  <InfoField label="Data Resultado" value={fmt(processo.data_resultado)} />
                  <InfoField label="Data Validação" value={fmt(processo.data_validacao)} />
                  <InfoField label="Data Envio Relatório" value={fmt(processo.data_envio_relatorio)} />
                  <InfoField label="Fração fetal" value={processo.fracao_fetal || ''} />
                  <InfoField label="Relatório validado" value={processo.relatorio_validado ? 'Sim' : 'Não'} />
                </div>
              </Section>
              <Section title="Resultados genéticos" icon={FileText}>
                <ProcessResultadoTab processo={processo} canUpdate={false} />
              </Section>
            </div>
          )}

          {tab === 'kits' && (
            <Section title="Kit associado" icon={Package}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <InfoField label="Posto" value={processo.posto} />
                <InfoField label="Teste" value={processo.teste} />
                <InfoField label="Médico" value={processo.medico} />
                <InfoField label="Código de Barras do Kit" value={processo.kit_codigo || ''} mono />
                <InfoField label="Data da Colheita" value={fmt(processo.data_colheita)} />
              </div>
            </Section>
          )}

          {tab === 'notas' && (
            <Section title="Notas" icon={StickyNote}>
              <InfoField label="Notas internas" value={processo.observacoes || paciente?.notas_internas || ''} />
            </Section>
          )}

          {tab === 'anexos' && processo.paciente_id && (
            <AnexosTab
              pacienteId={processo.paciente_id}
              canUpdate={false}
              canDelete={false}
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
