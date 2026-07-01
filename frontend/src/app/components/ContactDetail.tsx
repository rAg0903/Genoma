import { useEffect, useState } from 'react';
import { Edit, Trash2, Phone, MapPin, User, FileText, Baby, Syringe, Receipt, StickyNote, Paperclip, Plus, Download, Ban } from 'lucide-react';
import { deleteTargetLabel } from '../../lib/confirm-delete';
import { useConfirmDelete } from '../context/ConfirmDeleteContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { toast } from 'sonner';
import { Contact, Anexo, Processo } from '../data/types';
import { useData } from '../context/DataContext';
import { CONTACTO_PIPELINE_LABEL, getContactoPipelineEstado, isContactoCancelado, isProcessoLaboratorio } from '../../lib/contactos';
import { formatCalendarDatePt } from '../../lib/dates';
import { extractFaturacaoFromContact, resolveFaturacao } from '../../lib/faturacao';
import { calcularDataPartoPrevista, calcularGestacaoAtual, formatDataPartoPt } from '../../lib/gestacao';
import { resolveTesteSelecionavelLabel } from '../../lib/testes';
import { ProcessFaturacaoView } from './shared/ProcessFaturacaoFields';
import { FaturacaoAlertBanner } from './shared/FaturacaoAlertBanner';
import { ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';
import { DETAIL, CONTROL, FORM, FormFieldWidth } from '../../lib/design-tokens';
import { FormAvatarInitials, FormPageBody, FormPageHeader, FormPageShell, FormPrimaryButton, FormTabContent } from './shared/FormPageChrome';

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const calculateAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
};

const formatAgeLabel = (birthDate?: string) => {
  const age = calculateAge(birthDate);
  return age !== null ? `${age} anos` : null;
};

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    Agendado: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Kit Reservado': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'Colheita Realizada': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    'Enviado Laboratorio': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Em Analise': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Resultado Disponivel': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Validado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    Faturado: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
    Cancelado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return map[estado] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
};

type TabId = 'identificacao' | 'gravidez' | 'colheita' | 'faturacao' | 'notas' | 'anexos';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'gravidez', label: 'Gravidez', icon: Baby },
  { id: 'colheita', label: 'Colheita', icon: Syringe },
  { id: 'faturacao', label: 'Faturação', icon: Receipt },
  { id: 'notas', label: 'Notas', icon: StickyNote },
  { id: 'anexos', label: 'Anexos', icon: Paperclip },
];

const formatDate = (value?: string) => formatCalendarDatePt(value);

export function ContactDetail({ contact, onBack, onEdit, onDelete, canUpdate = true, canDelete = true }: ContactDetailProps) {
  const { processos, testes, postos, motivosAnulacao, getAnexosByPaciente, addAnexo, deleteAnexo } = useData();
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabId>('identificacao');
  const contactProcessos = processos.filter((p) => p.paciente_id === contact.id && isProcessoLaboratorio(p.estado));
  const faturacao = resolveFaturacao(contact, contactProcessos[0]);
  const motivoAnulacaoNome = contact.motivo_anulacao_id
    ? motivosAnulacao.find((m) => m.id === contact.motivo_anulacao_id)?.nome || ''
    : '';
  const testeNome = resolveTesteSelecionavelLabel(testes, contact.teste_id);
  const postoNome = postos.find((p) => p.id === contact.posto_colheita_id)?.nome || '';

  return (
    <FormPageShell>
      <FormPageBody>
        <FormPageHeader
          onBack={onBack}
          title={contact.nome}
          subtitle={[
            formatAgeLabel(contact.data_nascimento),
            contact.genero,
            `NIF: ${contact.nif || '—'}`,
            (() => {
              const estado = getContactoPipelineEstado(contact);
              return estado ? CONTACTO_PIPELINE_LABEL[estado] : '';
            })(),
          ].filter(Boolean).join(' · ')}
          avatar={(
            <FormAvatarInitials
              initials={contact.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              tone="info"
            />
          )}
          actions={(canUpdate || canDelete) ? (
            <>
              {canUpdate && (
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
          ) : undefined}
          tabs={TABS}
          activeTab={tab}
          onTabChange={setTab}
        />

        <FormTabContent>
          {isContactoCancelado(contact) ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200/90">
              <Ban className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600 }}>{t('pages.contacts.form.voidedBanner')}</p>
                <p className="mt-0.5 opacity-90" style={{ fontSize: '13px' }}>
                  {motivoAnulacaoNome
                    ? `${t('pages.contacts.form.voidReason')}: ${motivoAnulacaoNome}`
                    : t('pages.contacts.form.voidedBannerDetail')}
                </p>
              </div>
            </div>
          ) : (
            <FaturacaoAlertBanner value={faturacao} context="contacto" onGoToFaturacao={() => setTab('faturacao')} />
          )}
        </FormTabContent>
        {tab === 'identificacao' && (
          <IdentificacaoTab contact={contact} motivoAnulacaoNome={motivoAnulacaoNome} />
        )}
        {tab === 'gravidez' && <GravidezTab contact={contact} testeNome={testeNome} processos={contactProcessos} />}
        {tab === 'colheita' && <ColheitaTab contact={contact} postoNome={postoNome} processos={contactProcessos} estadoBadge={estadoBadge} />}
        {tab === 'faturacao' && <FaturacaoTab faturacao={faturacao} />}
        {tab === 'notas' && <NotasTab contact={contact} processos={contactProcessos} />}
        {tab === 'anexos' && (
          <AnexosTab
            pacienteId={contact.id}
            canUpdate={canUpdate}
            canDelete={canDelete}
            getAnexos={getAnexosByPaciente}
            addAnexo={addAnexo}
            deleteAnexo={deleteAnexo}
          />
        )}
      </FormPageBody>
    </FormPageShell>
  );
}

export function Section({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className={DETAIL.card}>
      <div className={DETAIL.sectionTitle}>
        <span className={DETAIL.sectionIconBadge}>
          <Icon className={DETAIL.sectionIcon} />
        </span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function DetailPanel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`${DETAIL.panel} ${className}`}>{children}</div>;
}

export function DetailSection({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className={DETAIL.section}>
      <div className={DETAIL.sectionTitle}>
        <span className={DETAIL.sectionIconBadge}>
          <Icon className={DETAIL.sectionIcon} />
        </span>
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function DetailDivider() {
  return <div className={DETAIL.divider} role="separator" />;
}

export function InfoField({
  label,
  value,
  mono,
  width,
}: {
  label: string;
  value: string;
  mono?: boolean;
  width?: FormFieldWidth;
}) {
  const empty = !value || value === '—';
  return (
    <div className={width ? FORM.fieldWidth[width] : undefined}>
      <div className={DETAIL.label}>{label}</div>
      <div
        className={[DETAIL.value, empty ? DETAIL.valueEmpty : ''].join(' ')}
        style={{ fontFamily: mono ? 'monospace' : undefined }}
      >
        {value || '—'}
      </div>
    </div>
  );
}

function IdentificacaoTab({ contact, motivoAnulacaoNome }: { contact: Contact; motivoAnulacaoNome: string }) {
  const { t } = useLanguage();
  const ageLabel = formatAgeLabel(contact.data_nascimento);

  return (
    <FormTabContent>
      <DetailPanel>
        <DetailSection title="Dados do contacto" icon={User}>
          <div className={FORM.fieldRow}>
            <InfoField label="Nome completo" value={contact.nome} width="2xl" />
            <InfoField label="Data de nascimento" value={formatDate(contact.data_nascimento)} width="sm" />
            <InfoField label="Idade" value={ageLabel || ''} width="xs" />
            <InfoField label="Género" value={contact.genero} width="md" />
            <InfoField label="NIF" value={contact.nif} mono width="md" />
            <InfoField label="Telemóvel" value={contact.telemovel} width="lg" />
            <InfoField label="Email" value={contact.email} width="xl" />
            <InfoField label="Altura" value={contact.altura ? `${contact.altura} cm` : ''} width="xs" />
            <InfoField label="Peso" value={contact.peso ? `${contact.peso} kg` : ''} width="xs" />
          </div>
        </DetailSection>

        <DetailDivider />

        <DetailSection title="Morada" icon={MapPin}>
          <div className={FORM.fieldRow}>
            <InfoField label="Morada" value={contact.morada} width="3xl" />
            <InfoField label="Código postal" value={contact.codigo_postal} width="sm" />
            <InfoField label="Cidade" value={contact.cidade} width="lg" />
            <InfoField label="Distrito" value={contact.distrito} width="lg" />
            <InfoField label="País" value={contact.pais} width="md" />
          </div>
        </DetailSection>

      {isContactoCancelado(contact) && (
        <>
          <DetailDivider />
          <DetailSection title={t('pages.contacts.form.voided')} icon={Ban}>
            <div className={FORM.fieldRow}>
              <InfoField label={t('pages.contacts.form.voided')} value="Sim" width="sm" />
              <InfoField label={t('pages.contacts.form.voidReason')} value={motivoAnulacaoNome} width="2xl" />
              {contact.data_anulacao && (
                <InfoField label="Data de anulação" value={formatDate(contact.data_anulacao)} width="sm" />
              )}
            </div>
          </DetailSection>
        </>
      )}
      </DetailPanel>
    </FormTabContent>
  );
}

function GravidezTab({ contact, testeNome, processos }: { contact: Contact; testeNome: string; processos: { id: string; numero: string; teste: string; data_colheita?: string }[] }) {
  const { t } = useLanguage();
  const hasContactData = !!(
    contact.medico_id || contact.teste_id || contact.onde_seguida
    || contact.gestacao_semanas_registo != null || contact.gestacao_dias_registo != null
  );
  const gestacaoAtual = contact.gestacao_semanas_registo != null
    && contact.gestacao_registada_em
    ? calcularGestacaoAtual(
      contact.gestacao_semanas_registo,
      contact.gestacao_dias_registo ?? 0,
      contact.gestacao_registada_em,
    )
    : null;
  const dataParto = contact.gestacao_semanas_registo != null && contact.gestacao_registada_em
    ? calcularDataPartoPrevista(
      contact.gestacao_semanas_registo,
      contact.gestacao_dias_registo ?? 0,
      contact.gestacao_registada_em,
    )
    : null;

  return (
    <FormTabContent>
      <DetailPanel>
        <DetailSection title="Gravidez" icon={Baby}>
          {hasContactData ? (
            <div className={FORM.fieldRow}>
              <InfoField label={t('pages.contacts.form.pack')} value={testeNome} width="lg" />
              <InfoField label="Tipo de gravidez" value={contact.tipo_gravidez === 'gemelar' ? 'Gemelar' : contact.tipo_gravidez === 'singular' ? 'Singular' : ''} width="md" />
              <InfoField label="Onde é seguida" value={contact.onde_seguida || ''} width="2xl" />
              {contact.gestacao_semanas_registo != null && (
                <InfoField
                  label="Tempo de gestação (registo)"
                  value={`${contact.gestacao_semanas_registo} sem · ${contact.gestacao_dias_registo ?? 0} dias`}
                  width="lg"
                />
              )}
              {gestacaoAtual && (
                <InfoField
                  label="Tempo de gestação (actual)"
                  value={`${gestacaoAtual.semanas} sem · ${gestacaoAtual.dias} dias`}
                  width="lg"
                />
              )}
              {dataParto && (
                <InfoField label="Data prevista do parto" value={formatDataPartoPt(dataParto)} width="sm" />
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Sem dados de gravidez registados.</p>
          )}
          {processos.length > 0 && (
            <>
              <DetailDivider />
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Processos após colheita</p>
                {processos.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 dark:border-[#3d4f6a]/45 dark:bg-[#151f30]/50">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.numero} · {p.teste}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(p.data_colheita)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </DetailSection>
      </DetailPanel>
    </FormTabContent>
  );
}

function ColheitaTab({ contact, postoNome, processos, estadoBadge }: { contact: Contact; postoNome: string; processos: { id: string; numero: string; kit_codigo: string; estado: string; data_colheita?: string }[]; estadoBadge: (e: string) => string }) {
  const hasAgendamento = !!(contact.posto_colheita_id || contact.data_colheita_prevista);
  return (
    <FormTabContent>
      <DetailPanel>
        <DetailSection title="Colheita" icon={Syringe}>
          {hasAgendamento && (
            <div className={`${FORM.fieldRow} mb-4`}>
              <InfoField label="Posto de colheita" value={postoNome} width="2xl" />
              <InfoField label="Data prevista" value={formatDate(contact.data_colheita_prevista)} width="sm" />
            </div>
          )}
          {processos.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {hasAgendamento ? 'Processo criado após data efetiva e seleção do kit.' : 'Sem colheita agendada nem processos.'}
            </p>
          ) : (
            <div className="space-y-2">
              {processos.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 dark:border-[#3d4f6a]/45 dark:bg-[#151f30]/50">
                  <div>
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.numero}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{p.kit_codigo ? `Kit ${p.kit_codigo}` : 'Sem kit associado'} · Colheita: {formatDate(p.data_colheita)}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge(p.estado)}`}>{p.estado}</span>
                </div>
              ))}
            </div>
          )}
        </DetailSection>
      </DetailPanel>
    </FormTabContent>
  );
}

function FaturacaoTab({ faturacao }: { faturacao: ReturnType<typeof extractFaturacaoFromContact> }) {
  return (
    <FormTabContent>
      <DetailPanel>
        <DetailSection title="Faturação" icon={Receipt}>
          <ProcessFaturacaoView value={faturacao} />
        </DetailSection>
      </DetailPanel>
    </FormTabContent>
  );
}

function NotasTab({ contact, processos }: { contact: Contact; processos: { id: string; numero: string; observacoes?: string }[] }) {
  const comNotas = processos.filter((p) => p.observacoes && p.observacoes.trim());
  return (
    <FormTabContent>
      <DetailPanel>
        <DetailSection title="Notas" icon={StickyNote}>
          {contact.notas_internas?.trim() ? (
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{contact.notas_internas}</p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Sem notas no contacto.</p>
          )}
          {comNotas.length > 0 && (
            <>
              <DetailDivider />
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Notas nos processos</p>
                {comNotas.map((p) => (
                  <div key={p.id} className="rounded-lg border border-slate-200/80 bg-slate-50/70 px-3 py-2.5 dark:border-[#3d4f6a]/45 dark:bg-[#151f30]/50">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{p.numero}</div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{p.observacoes}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </DetailSection>
      </DetailPanel>
    </FormTabContent>
  );
}

export function AnexosTab({
  pacienteId, canUpdate, canDelete, getAnexos, addAnexo, deleteAnexo,
}: {
  pacienteId: string;
  canUpdate: boolean;
  canDelete: boolean;
  getAnexos: (id: string) => Promise<Anexo[]>;
  addAnexo: (data: { paciente_id?: string; tipo: Anexo['tipo']; titulo: string; descricao?: string; url?: string }) => Promise<void>;
  deleteAnexo: (id: string) => Promise<void>;
}) {
  const confirmDelete = useConfirmDelete();
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{ tipo: Anexo['tipo']; titulo: string; descricao: string; url: string }>({ tipo: 'Documento', titulo: '', descricao: '', url: '' });

  const reload = async () => {
    setLoading(true);
    try { setAnexos(await getAnexos(pacienteId)); }
    catch { setAnexos([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { void reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pacienteId]);

  const handleAdd = async () => {
    if (!form.titulo.trim()) { toast.error('Título é obrigatório.'); return; }
    try {
      await addAnexo({ paciente_id: pacienteId, tipo: form.tipo, titulo: form.titulo, descricao: form.descricao, url: form.url });
      toast.success('Anexo adicionado.');
      setForm({ tipo: 'Documento', titulo: '', descricao: '', url: '' });
      setShowForm(false);
      await reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao adicionar anexo.'); }
  };

  const handleDelete = async (id: string, titulo: string) => {
    if (!(await confirmDelete(deleteTargetLabel('o anexo', titulo)))) return;
    try { await deleteAnexo(id); toast.success('Anexo removido.'); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao remover.'); }
  };

  const input = `${CONTROL.input} text-sm`;

  return (
    <FormTabContent>
      <DetailPanel>
        <DetailSection title="Anexos" icon={Paperclip}>
      {canUpdate && (
        <div className="mb-4">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50" style={{ fontSize: '12px', fontWeight: 500 }}>
              <Plus className="w-3.5 h-3.5" /> Adicionar anexo
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-slate-800/25 rounded-lg">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select className={input} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as Anexo['tipo'] })}>
                  <option value="Documento">Documento</option>
                  <option value="Email">E-mail (enviado/recebido)</option>
                  <option value="Outro">Outro</option>
                </select>
                <input className={input} placeholder="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
              </div>
              <input className={input} placeholder="URL / referência (opcional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              <textarea className={input} rows={2} placeholder="Descrição (opcional)" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600">Cancelar</button>
                <button onClick={() => void handleAdd()} className={ADD_ACTION_BUTTON_CLASS}>Guardar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '13px' }}>A carregar…</p>
      ) : anexos.length === 0 ? (
        <div className="py-8 text-center">
          <FileText className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
          <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '13px' }}>Sem anexos (documentos ou registo de e-mails).</p>
        </div>
      ) : (
        <div className="space-y-2">
          {anexos.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/30 rounded-lg">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200">{a.tipo}</span>
                  <span className="text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{a.titulo}</span>
                </div>
                {a.descricao && <p className="text-gray-500 dark:text-gray-400 mt-1 truncate" style={{ fontSize: '12px' }}>{a.descricao}</p>}
                <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '11px' }}>{formatDate(a.created_at)}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {a.url && <a href={a.url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Abrir"><Download className="w-4 h-4" /></a>}
                {canDelete && <button onClick={() => void handleDelete(a.id, a.titulo)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Remover"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
        </DetailSection>
      </DetailPanel>
    </FormTabContent>
  );
}
