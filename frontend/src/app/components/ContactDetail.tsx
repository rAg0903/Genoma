import { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Trash2, Phone, MapPin, User, FileText, Baby, Syringe, Receipt, StickyNote, Paperclip, Plus, Download, Ban } from 'lucide-react';
import { toast } from 'sonner';
import { Contact, Anexo, Processo } from '../data/types';
import { useData } from '../context/DataContext';
import { CONTACTO_PIPELINE_LABEL, getContactoPipelineEstado, isContactoCancelado, isProcessoLaboratorio } from '../../lib/contactos';
import { formatCalendarDatePt } from '../../lib/dates';
import { extractFaturacaoFromContact, resolveFaturacao } from '../../lib/faturacao';
import { calcularDataPartoPrevista, calcularGestacaoAtual, formatDataPartoPt } from '../../lib/gestacao';
import { resolveTesteSelecionavelLabel } from '../../lib/testes';
import { useLanguage } from '../../i18n/LanguageContext';
import { ProcessFaturacaoView } from './shared/ProcessFaturacaoFields';
import { FaturacaoAlertBanner } from './shared/FaturacaoAlertBanner';

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canUpdate?: boolean;
  canDelete?: boolean;
}

const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
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
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 dark:text-blue-400" style={{ fontSize: '15px', fontWeight: 700 }}>
                {contact.nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
              </span>
            </div>
            <div className="min-w-0">
              <h1 className="text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: '18px', fontWeight: 600 }}>{contact.nome}</h1>
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px', marginTop: 2 }}>
                {calculateAge(contact.data_nascimento)} anos · {contact.genero} · NIF: {contact.nif || '—'}
                {(() => {
                  const estado = getContactoPipelineEstado(contact);
                  return estado ? ` · ${CONTACTO_PIPELINE_LABEL[estado]}` : '';
                })()}
              </p>
            </div>
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

        {/* Tabs */}
        <div className="flex gap-1 mt-4 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={{ fontSize: '13px', fontWeight: active ? 600 : 500 }}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="max-w-3xl mb-4">
          {isContactoCancelado(contact) ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200">
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
        </div>
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
      </div>
    </div>
  );
}

export function Section({ title, icon: Icon, children }: { title: string; icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        <h2 className="text-gray-700 dark:text-gray-300" style={{ fontSize: '14px', fontWeight: 600 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function InfoField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-gray-400 dark:text-gray-500" style={{ fontSize: '11px', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div className="text-gray-900 dark:text-gray-100" style={{ fontSize: '14px', fontFamily: mono ? 'monospace' : undefined }}>{value || '—'}</div>
    </div>
  );
}

function IdentificacaoTab({ contact, motivoAnulacaoNome }: { contact: Contact; motivoAnulacaoNome: string }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4 max-w-3xl">
      <Section title="Informação Pessoal" icon={User}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoField label="Nome completo" value={contact.nome} />
          <InfoField label="Data de Nascimento" value={formatDate(contact.data_nascimento)} />
          <InfoField label="Idade" value={`${calculateAge(contact.data_nascimento)} anos`} />
          <InfoField label="Género" value={contact.genero} />
          <InfoField label="NIF" value={contact.nif} mono />
          <InfoField label="Altura" value={contact.altura ? `${contact.altura} cm` : ''} />
          <InfoField label="Peso" value={contact.peso ? `${contact.peso} kg` : ''} />
        </div>
      </Section>
      <Section title="Contacto" icon={Phone}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <InfoField label="Telemóvel" value={contact.telemovel} />
          <InfoField label="Email" value={contact.email} />
        </div>
      </Section>
      <Section title="Morada" icon={MapPin}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="col-span-2 md:col-span-3"><InfoField label="Morada" value={contact.morada} /></div>
          <InfoField label="Código Postal" value={contact.codigo_postal} />
          <InfoField label="Cidade" value={contact.cidade} />
          <InfoField label="Distrito" value={contact.distrito} />
          <InfoField label="País" value={contact.pais} />
        </div>
      </Section>
      {isContactoCancelado(contact) && (
        <Section title={t('pages.contacts.form.voided')} icon={Ban}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label={t('pages.contacts.form.voided')} value="Sim" />
            <InfoField label={t('pages.contacts.form.voidReason')} value={motivoAnulacaoNome} />
            {contact.data_anulacao && (
              <InfoField label="Data de anulação" value={formatDate(contact.data_anulacao)} />
            )}
          </div>
        </Section>
      )}
    </div>
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
    <Section title="Gravidez" icon={Baby}>
      {hasContactData ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <InfoField label={t('pages.contacts.form.pack')} value={testeNome} />
          <InfoField label="Tipo de gravidez" value={contact.tipo_gravidez === 'gemelar' ? 'Gemelar' : contact.tipo_gravidez === 'singular' ? 'Singular' : ''} />
          <InfoField label="Onde é seguida" value={contact.onde_seguida || ''} />
          {contact.gestacao_semanas_registo != null && (
            <InfoField
              label="Tempo de gestação (data registo)"
              value={`${contact.gestacao_semanas_registo} semanas · ${contact.gestacao_dias_registo ?? 0} dias`}
            />
          )}
          {gestacaoAtual && (
            <InfoField
              label="Tempo de gestação (actual)"
              value={`${gestacaoAtual.semanas} semanas · ${gestacaoAtual.dias} dias`}
            />
          )}
          {dataParto && (
            <InfoField label="Data prevista do parto" value={formatDataPartoPt(dataParto)} />
          )}
        </div>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 mb-4" style={{ fontSize: '13px' }}>Sem dados de gravidez registados.</p>
      )}
      {processos.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '12px' }}>Processos após colheita:</p>
          {processos.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-gray-900 dark:text-gray-100" style={{ fontSize: '13px', fontWeight: 500 }}>{p.numero} · {p.teste}</span>
              <span className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>{formatDate(p.data_colheita)}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function ColheitaTab({ contact, postoNome, processos, estadoBadge }: { contact: Contact; postoNome: string; processos: { id: string; numero: string; kit_codigo: string; estado: string; data_colheita?: string }[]; estadoBadge: (e: string) => string }) {
  const hasAgendamento = !!(contact.posto_colheita_id || contact.data_colheita_prevista);
  return (
    <Section title="Colheita" icon={Syringe}>
      {hasAgendamento && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <InfoField label="Posto de colheita" value={postoNome} />
          <InfoField label="Data prevista" value={formatDate(contact.data_colheita_prevista)} />
        </div>
      )}
      {processos.length === 0 ? (
        <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '13px' }}>
          {hasAgendamento ? 'Processo criado após data efetiva e seleção do kit.' : 'Sem colheita agendada nem processos.'}
        </p>
      ) : (
        <div className="space-y-2">
          {processos.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <div className="text-gray-900 dark:text-gray-100" style={{ fontSize: '13px', fontWeight: 500 }}>{p.numero}</div>
                <div className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px' }}>{p.kit_codigo ? `Kit ${p.kit_codigo}` : 'Sem kit associado'} · Colheita: {formatDate(p.data_colheita)}</div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge(p.estado)}`}>{p.estado}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

function FaturacaoTab({ faturacao }: { faturacao: ReturnType<typeof extractFaturacaoFromContact> }) {
  return (
    <Section title="Faturação" icon={Receipt}>
      <ProcessFaturacaoView value={faturacao} />
    </Section>
  );
}

function NotasTab({ contact, processos }: { contact: Contact; processos: { id: string; numero: string; observacoes?: string }[] }) {
  const comNotas = processos.filter((p) => p.observacoes && p.observacoes.trim());
  return (
    <Section title="Notas" icon={StickyNote}>
      {contact.notas_internas?.trim() ? (
        <p className="text-gray-600 dark:text-gray-300 mb-4" style={{ fontSize: '13px' }}>{contact.notas_internas}</p>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 mb-4" style={{ fontSize: '13px' }}>Sem notas no contacto.</p>
      )}
      {comNotas.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '12px' }}>Notas nos processos:</p>
          {comNotas.map((p) => (
            <div key={p.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-gray-900 dark:text-gray-100" style={{ fontSize: '13px', fontWeight: 500 }}>{p.numero}</div>
              <p className="text-gray-600 dark:text-gray-300 mt-1" style={{ fontSize: '13px' }}>{p.observacoes}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
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

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este anexo?')) return;
    try { await deleteAnexo(id); toast.success('Anexo removido.'); await reload(); }
    catch (e) { toast.error(e instanceof Error ? e.message : 'Falha ao remover.'); }
  };

  const input = 'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100';

  return (
    <Section title="Anexos" icon={Paperclip}>
      {canUpdate && (
        <div className="mb-4">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50" style={{ fontSize: '12px', fontWeight: 500 }}>
              <Plus className="w-3.5 h-3.5" /> Adicionar anexo
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
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
                <button onClick={() => void handleAdd()} className="px-3 py-1.5 text-sm rounded-lg bg-teal-600 text-white hover:bg-teal-700">Guardar</button>
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
            <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
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
                {canDelete && <button onClick={() => void handleDelete(a.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Remover"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
