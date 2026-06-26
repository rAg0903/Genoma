import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Save, User, Phone, MapPin, Baby, Syringe, Receipt, StickyNote, Paperclip,
  AlertTriangle, CheckCircle2, Package, X, Loader2, Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { createPostalCodeAutofillHandlers } from '../../lib/postal-code-pt';
import { filterPostosNearContact, formatPostoProximidadeMotivo, hasValidContactPostalCode } from '../../lib/posto-proximity';
import { getTestesComSubTestes, getTestesSelecionaveisComLabel, resolveParentFromTesteId, resolvePrecoTesteSelecionavel, resolveTesteSelecionavelLabel } from '../../lib/testes';
import { Contact, Processo } from '../data/types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../lib/api';
import { getAuthToken } from '../../lib/api-processos';
import { buildContactClinicalPayload, buildContactPosConversao, contactTemProcessoAtivo,
  CONTACTO_ESTADO_LABEL, findProcessoDoContacto, isProcessoLaboratorio,
} from '../../lib/contactos';
import { todayLocal } from '../../lib/dates';
import {
  buildFaturacaoPayload,
  emptyProcessFaturacao,
  ProcessFaturacaoData,
  validateFaturacaoData,
} from '../../lib/process-form';
import { extractFaturacaoFromContact, mergeFaturacaoIntoContact } from '../../lib/faturacao';
import { filterMotivosPorContexto } from '../../lib/motivos-anulacao';
import { ApiPaciente, mapApiPacienteToContact } from '../../lib/pacientes';
import { Section, AnexosTab } from './ContactDetail';
import { GestacaoFields } from './GestacaoFields';
import { ProcessFaturacaoFields } from './shared/ProcessFaturacaoFields';
import { FaturacaoAlertBanner } from './shared/FaturacaoAlertBanner';
import { Medico, medicosApi } from '../../lib/api-medicos';
import { parseGestacaoRegistoInput } from '../../lib/gestacao';

type TabId = 'identificacao' | 'gravidez' | 'colheita' | 'faturacao' | 'notas' | 'anexos';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'gravidez', label: 'Gravidez', icon: Baby },
  { id: 'colheita', label: 'Colheita', icon: Syringe },
  { id: 'faturacao', label: 'Faturação', icon: Receipt },
  { id: 'notas', label: 'Notas', icon: StickyNote },
  { id: 'anexos', label: 'Anexos', icon: Paperclip },
];

const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500';
const labelClass = 'block mb-1.5 text-gray-600 dark:text-gray-400';

const emptyForm: Omit<Contact, 'id' | 'created_at'> = {
  nome: '', data_nascimento: '', genero: 'Feminino', nif: '', telemovel: '', email: '', morada: '',
  codigo_postal: '', pais: '', distrito: '', cidade: '', altura: '', peso: '',
};

const today = todayLocal;

const emptyGravidez = {
  medico_id: '', entidade_id: '', onde_seguida: '', teste_pai_id: '', teste_id: '', tipo_gravidez: 'Singular',
  gestacao_semanas_registo: '', gestacao_dias_registo: '', gestacao_registada_em: '',
};
const emptyColheita = { posto_id: '', data_prevista: '', data_efetiva: '' };

interface KitOpcao { id: string; codigo_barras: string; tracking: string; tipo_kit: string; teste_nome?: string; data_validade: string }

export function ContactFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    contacts, addContact, updateContact, processos, addProcesso, updateProcesso,
    postos, testes, motivosAnulacao, getPostoStock, getPostoKitsDisponiveis, marcarKitUtilizado,
    getAnexosByPaciente, addAnexo, deleteAnexo,
  } = useData();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission('contactos', 'update');
  const canCreate = hasPermission('contactos', 'create');
  const canUpdateProcesso = hasPermission('processos', 'update');

  const editing = Boolean(id);
  const [tab, setTab] = useState<TabId>('identificacao');
  const [form, setForm] = useState<Omit<Contact, 'id' | 'created_at'>>(emptyForm);
  const [savedContactId, setSavedContactId] = useState<string | null>(id ?? null);
  const [saving, setSaving] = useState(false);

  // Gravidez (campos que alimentam o processo automático)
  const [gravidez, setGravidez] = useState(emptyGravidez);
  // Colheita
  const [colheita, setColheita] = useState(emptyColheita);
  const [notas, setNotas] = useState('');
  const [medicos, setMedicos] = useState<Medico[]>([]);

  // Validação de stock por posto
  const [stockInfo, setStockInfo] = useState<{ disponiveis: number } | null>(null);
  const [checkingStock, setCheckingStock] = useState(false);

  // Modal de seleção de kit + resultado
  const [kitModal, setKitModal] = useState<{ open: boolean; loading: boolean; kits: KitOpcao[] }>({ open: false, loading: false, kits: [] });
  const [labPreview, setLabPreview] = useState<{ id: string; nome: string; codigo?: string } | null>(null);
  const [linked, setLinked] = useState<{ kit: string; processo: string } | null>(null);
  const [estadoAgendamento, setEstadoAgendamento] = useState<Contact['estado_agendamento']>(null);

  const postosAtivos = useMemo(() => postos.filter((p) => p.ativo !== false), [postos]);
  const contactoTemMoradaParaColheita = useMemo(
    () => Boolean(form.morada?.trim()) && hasValidContactPostalCode(form.codigo_postal),
    [form.morada, form.codigo_postal],
  );
  const postosProximos = useMemo(() => {
    if (!contactoTemMoradaParaColheita) return [];
    return filterPostosNearContact(postosAtivos, {
      codigo_postal: form.codigo_postal,
      distrito: form.distrito,
      cidade: form.cidade,
    });
  }, [contactoTemMoradaParaColheita, postosAtivos, form.codigo_postal, form.distrito, form.cidade]);
  const testesComSubTestes = useMemo(() => getTestesComSubTestes(testes), [testes]);
  const subTestesDoPai = useMemo(() => {
    const pai = testesComSubTestes.find((t) => t.id === gravidez.teste_pai_id);
    return (pai?.sub_testes || []).filter((st) => st.ativo !== false);
  }, [testesComSubTestes, gravidez.teste_pai_id]);
  const testeSelecionadoNome = useMemo(
    () => resolveTesteSelecionavelLabel(testes, gravidez.teste_id),
    [testes, gravidez.teste_id],
  );
  const entidadesDoMedico = useMemo(() => {
    if (!gravidez.medico_id) return [];
    const medico = medicos.find((m) => m.utilizador_id === gravidez.medico_id);
    return medico?.locais_trabalho || [];
  }, [gravidez.medico_id, medicos]);

  const ondeSeguidaNome = useMemo(
    () => entidadesDoMedico.find((l) => l.entidade_id === gravidez.entidade_id)?.entidade_nome || '',
    [entidadesDoMedico, gravidez.entidade_id],
  );
  const gestacaoDataRegisto = useMemo(() => {
    if (gravidez.gestacao_registada_em) return gravidez.gestacao_registada_em;
    if (parseGestacaoRegistoInput(gravidez.gestacao_semanas_registo, gravidez.gestacao_dias_registo)) {
      return today();
    }
    return '';
  }, [gravidez.gestacao_registada_em, gravidez.gestacao_semanas_registo, gravidez.gestacao_dias_registo]);
  const contactProcessos = savedContactId
    ? processos.filter((p) => p.paciente_id === savedContactId && isProcessoLaboratorio(p.estado))
    : [];
  const [contactFaturacao, setContactFaturacao] = useState<ProcessFaturacaoData>(emptyProcessFaturacao());
  const [anulacao, setAnulacao] = useState({ anulado: false, motivo_anulacao_id: '' });
  const canEditFaturacao = canUpdate || canCreate;
  const temProcessoAtivo = savedContactId ? contactTemProcessoAtivo(savedContactId, processos) : false;
  const motivosAtivos = useMemo(
    () => filterMotivosPorContexto(motivosAnulacao, 'contacto'),
    [motivosAnulacao],
  );

  const buildPayload = () => mergeFaturacaoIntoContact(
    {
      ...buildContactClinicalPayload(
        form,
        { ...gravidez, onde_seguida: ondeSeguidaNome },
        colheita,
        notas,
      ),
      estado_contacto: anulacao.anulado ? 'Cancelado' : null,
      motivo_anulacao_id: anulacao.anulado ? (anulacao.motivo_anulacao_id || null) : null,
    },
    contactFaturacao,
  );
  const hydratedIdRef = useRef<string | null>(null);

  const applyContactToForm = (c: Contact) => {
    setForm({
      nome: c.nome, data_nascimento: c.data_nascimento, genero: c.genero, nif: c.nif,
      telemovel: c.telemovel, email: c.email, morada: c.morada, codigo_postal: c.codigo_postal || '',
      pais: c.pais || '', distrito: c.distrito || '', cidade: c.cidade || '', altura: c.altura || '', peso: c.peso || '',
    });
    setGravidez({
      medico_id: c.medico_id || '',
      entidade_id: '',
      onde_seguida: c.onde_seguida || '',
      teste_pai_id: resolveParentFromTesteId(testes, c.teste_id)?.id || '',
      teste_id: c.teste_id || '',
      tipo_gravidez: c.tipo_gravidez === 'gemelar' ? 'Gemelar' : 'Singular',
      gestacao_semanas_registo: c.gestacao_semanas_registo != null ? String(c.gestacao_semanas_registo) : '',
      gestacao_dias_registo: c.gestacao_dias_registo != null ? String(c.gestacao_dias_registo) : '',
      gestacao_registada_em: c.gestacao_registada_em || '',
    });
    setColheita((prev) => ({
      posto_id: c.posto_colheita_id || '',
      data_prevista: c.data_colheita_prevista || '',
      data_efetiva: prev.data_efetiva,
    }));
    setNotas(c.notas_internas || '');
    setEstadoAgendamento(c.estado_agendamento || null);
    setContactFaturacao(extractFaturacaoFromContact(c));
    setAnulacao({
      anulado: c.estado_contacto === 'Cancelado',
      motivo_anulacao_id: c.motivo_anulacao_id || '',
    });
    setSavedContactId(c.id);
  };

  // Novo contacto: limpar estado residual de edições anteriores
  useEffect(() => {
    if (id) return;
    hydratedIdRef.current = null;
    setSavedContactId(null);
    setForm(emptyForm);
    setGravidez(emptyGravidez);
    setColheita(emptyColheita);
    setNotas('');
    setEstadoAgendamento(null);
    setLinked(null);
    setContactFaturacao(emptyProcessFaturacao());
    setAnulacao({ anulado: false, motivo_anulacao_id: '' });
    setTab('identificacao');
  }, [id]);

  // Contacto ja convertido em processo → redirecionar para Processos
  useEffect(() => {
    if (!id || !contactTemProcessoAtivo(id, processos)) return;
    const proc = findProcessoDoContacto(id, processos);
    if (!proc) return;
    toast.info('Este registo ja e um processo. A redirecionar…');
    navigate(`/processos/${proc.id}/editar`, { replace: true });
  }, [id, processos, navigate]);

  // Carregar contacto em modo edição (uma vez por id — evita apagar campos ao refrescar a lista)
  useEffect(() => {
    if (!id) {
      hydratedIdRef.current = null;
      return;
    }
    if (contactTemProcessoAtivo(id, processos)) return;
    if (hydratedIdRef.current === id) return;

    const fromList = contacts.find((x) => x.id === id);
    if (fromList) {
      applyContactToForm(fromList);
      hydratedIdRef.current = id;
      return;
    }

    const token = getAuthToken();
    if (!token) return;

    apiRequest<ApiPaciente>(`/pacientes/${id}`, { token })
      .then((paciente) => {
        if (!paciente?.id || hydratedIdRef.current === id) return;
        applyContactToForm(mapApiPacienteToContact(paciente));
        hydratedIdRef.current = id;
      })
      .catch(() => { /* contacto indisponível */ });
  }, [id, contacts]);

  // Carregar médicos (com entidades de trabalho) para o separador Gravidez
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    medicosApi.list()
      .then((data) => setMedicos(data || []))
      .catch(() => setMedicos([]));
  }, []);

  useEffect(() => {
    const preco = resolvePrecoTesteSelecionavel(testes, gravidez.teste_id);
    if (preco == null) return;
    setContactFaturacao((prev) => ({
      ...prev,
      valor_base: preco,
      valor_final: Number((preco * (1 - Number(prev.desconto_percentual || 0) / 100)).toFixed(2)),
    }));
  }, [gravidez.teste_id, testes]);

  // Resolver entidade_id a partir do nome guardado (contactos já existentes)
  useEffect(() => {
    if (!gravidez.medico_id || gravidez.entidade_id || !gravidez.onde_seguida) return;
    const medico = medicos.find((m) => m.utilizador_id === gravidez.medico_id);
    const match = medico?.locais_trabalho?.find(
      (l) => l.entidade_nome === gravidez.onde_seguida,
    );
    if (match) {
      setGravidez((prev) => ({ ...prev, entidade_id: match.entidade_id }));
    }
  }, [medicos, gravidez.medico_id, gravidez.entidade_id, gravidez.onde_seguida]);

  // Limpar posto selecionado quando deixa de estar entre os postos próximos
  useEffect(() => {
    if (!colheita.posto_id) return;
    if (!contactoTemMoradaParaColheita) {
      setColheita((prev) => (prev.posto_id ? { ...prev, posto_id: '' } : prev));
      return;
    }
    const stillNearby = postosProximos.some(({ posto }) => posto.id === colheita.posto_id);
    if (!stillNearby) {
      setColheita((prev) => ({ ...prev, posto_id: '' }));
    }
  }, [colheita.posto_id, contactoTemMoradaParaColheita, postosProximos]);

  // Validação de stock quando posto + data prevista + teste estão preenchidos
  useEffect(() => {
    if (!colheita.posto_id || !colheita.data_prevista || !gravidez.teste_id) {
      setStockInfo(null);
      return;
    }
    let cancelled = false;
    setCheckingStock(true);
    getPostoStock(colheita.posto_id, gravidez.teste_id)
      .then((s) => { if (!cancelled) setStockInfo(s); })
      .catch(() => { if (!cancelled) setStockInfo(null); })
      .finally(() => { if (!cancelled) setCheckingStock(false); });
    return () => { cancelled = true; };
  }, [colheita.posto_id, colheita.data_prevista, gravidez.teste_id, getPostoStock]);

  const { handleCodigoPostalChange, autofillFromCp } = useMemo(
    () => createPostalCodeAutofillHandlers(setForm),
    [],
  );

  // Preencher cidade/distrito ao carregar contacto com CP mas sem morada completa
  useEffect(() => {
    if (!form.codigo_postal) return;
    if (form.cidade?.trim() && form.distrito?.trim()) return;
    void autofillFromCp(form.codigo_postal);
  }, [form.codigo_postal, savedContactId, autofillFromCp]);

  const validarIdentificacao = (): boolean => {
    if (!form.nome.trim()) { toast.error('Nome completo é obrigatório.'); setTab('identificacao'); return false; }
    if (!form.telemovel.trim()) { toast.error('Telemóvel é obrigatório.'); setTab('identificacao'); return false; }
    return true;
  };

  // Garante que o contacto está gravado (devolve o id) — usado antes de associar kit.
  const ensureSaved = async (): Promise<string | null> => {
    if (!validarIdentificacao()) return null;
    const payload = buildPayload();
    if (savedContactId) {
      if (canUpdate) {
        try {
          const updated = await updateContact(savedContactId, payload);
          applyContactToForm(updated);
          setEstadoAgendamento(updated.estado_agendamento ?? null);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Não foi possível guardar o contacto.');
          return null;
        }
      }
      return savedContactId;
    }
    try {
      const created = await addContact(payload);
      applyContactToForm(created);
      setEstadoAgendamento(created.estado_agendamento ?? null);
      return created.id;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível guardar o contacto.');
      return null;
    }
  };

  const handleGuardar = async () => {
    if (!validarIdentificacao()) return;
    if (anulacao.anulado && !anulacao.motivo_anulacao_id) {
      toast.error(t('pages.contacts.form.voidReasonRequired'));
      setTab('identificacao');
      return;
    }
    if (!anulacao.anulado) {
      const fatErr = validateFaturacaoData(contactFaturacao);
      if (fatErr) {
        toast.error(fatErr);
        setTab('faturacao');
        return;
      }
    }
    setSaving(true);
    try {
      const isNew = !savedContactId;
      const payload = buildPayload();
      const saved = savedContactId
        ? await updateContact(savedContactId, payload)
        : await addContact(payload);
      applyContactToForm(saved);
      setEstadoAgendamento(saved.estado_agendamento ?? null);
      if (payload.gestacao_registada_em) {
        setGravidez((g) => ({ ...g, gestacao_registada_em: payload.gestacao_registada_em || '' }));
      }

      if (contactProcessos.length > 0 && canUpdateProcesso) {
        for (const p of contactProcessos) {
          await updateProcesso(p.id, buildFaturacaoPayload(contactFaturacao));
        }
      }

      toast.success(isNew ? 'Contacto criado com sucesso!' : 'Contacto atualizado com sucesso!');

      if (isNew && saved.id) {
        hydratedIdRef.current = saved.id;
        navigate(`/contactos/${saved.id}/editar`, { replace: true });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao guardar contacto.');
    } finally {
      setSaving(false);
    }
  };

  // Ao preencher a Data Efetiva → abrir modal de seleção de kit
  const handleDataEfetiva = async (value: string) => {
    setColheita((c) => ({ ...c, data_efetiva: value }));
    if (!value || linked) return;
    if (anulacao.anulado) {
      toast.error(t('pages.contacts.form.voidedBannerDetail'));
      setColheita((c) => ({ ...c, data_efetiva: '' }));
      return;
    }
    if (!colheita.posto_id) { toast.error('Selecione primeiro o Posto de Colheita.'); return; }
    if (!gravidez.medico_id || !gravidez.teste_id) {
      toast.error(t('pages.contacts.form.selectPackGravidez'));
      setTab('gravidez');
      return;
    }
    const contactId = await ensureSaved();
    if (!contactId) return;
    setKitModal({ open: true, loading: true, kits: [] });
    setLabPreview(null);
    try {
      const kits = await getPostoKitsDisponiveis(colheita.posto_id, gravidez.teste_id);
      const token = getAuthToken();
      if (token && colheita.posto_id) {
        try {
          const res = await apiRequest<{ data: { id: string; nome: string; codigo?: string } | null }>(
            `/colheitas/laboratorio-final/preview?posto_id=${encodeURIComponent(colheita.posto_id)}`,
            { token },
          );
          setLabPreview(res.data ?? null);
        } catch {
          setLabPreview(null);
        }
      }
      setKitModal({ open: true, loading: false, kits });
    } catch (e) {
      setKitModal({ open: false, loading: false, kits: [] });
      setLabPreview(null);
      toast.error(e instanceof Error ? e.message : 'Falha ao carregar kits do posto.');
    }
  };

  const handleSelecionarKit = async (kit: KitOpcao) => {
    const contactId = savedContactId;
    if (!contactId) { toast.error('Guarde o contacto primeiro.'); return; }
    const postoNome = postos.find((p) => p.id === colheita.posto_id)?.nome || '';
    const gestacao = parseGestacaoRegistoInput(gravidez.gestacao_semanas_registo, gravidez.gestacao_dias_registo);
    try {
      const novoProcesso: Omit<Processo, 'id'> = {
        numero: kit.codigo_barras,
        paciente_id: contactId,
        paciente_nome: form.nome,
        medico: medicos.find((m) => m.utilizador_id === gravidez.medico_id)?.nome || '',
        medico_id: gravidez.medico_id,
        posto: postoNome,
        posto_id: colheita.posto_id || undefined,
        kit_codigo: kit.codigo_barras,
        estado: 'Colheita Realizada',
        data_entrada: today(),
        data_colheita: colheita.data_efetiva || today(),
        data_colheita_prevista: colheita.data_prevista || undefined,
        teste_id: gravidez.teste_id,
        teste: resolveTesteSelecionavelLabel(testes, gravidez.teste_id),
        observacoes: notas || undefined,
        onde_seguida: ondeSeguidaNome || undefined,
        tipo_gravidez: gravidez.tipo_gravidez === 'Gemelar' ? 'gemelar' : gravidez.tipo_gravidez === 'Singular' ? 'singular' : null,
        gestacao_semanas_registo: gestacao?.semanas ?? null,
        gestacao_dias_registo: gestacao?.dias ?? null,
        gestacao_registada_em: gestacaoDataRegisto || undefined,
        ...buildFaturacaoPayload(contactFaturacao),
      };
      const processo = await addProcesso(novoProcesso);
      await updateContact(contactId, buildContactPosConversao(form));
      try {
        await marcarKitUtilizado(kit.id, {
          processo_id: processo.id,
          posto_id: colheita.posto_id || undefined,
        });
      } catch { /* processo criado; estado do kit best-effort */ }
      setKitModal({ open: false, loading: false, kits: [] });
      setLabPreview(null);
      toast.success(`Processo ${processo.numero} criado. O registo passou para Processos.`);
      navigate(`/processos/${processo.id}/editar`, { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível associar o kit / criar o processo.');
    }
  };

  const initials = (form.nome || 'Novo Contacto').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const podeGuardar = savedContactId ? canUpdate : canCreate;

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/contactos')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-teal-700 dark:text-teal-400" style={{ fontSize: '15px', fontWeight: 700 }}>{initials || 'NC'}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: '18px', fontWeight: 600 }}>{form.nome || (editing ? 'Editar contacto' : 'Novo Contacto')}</h1>
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px', marginTop: 2 }}>
                {editing ? 'Edição de contacto' : 'Criação de contacto'}
                {estadoAgendamento ? ` · ${CONTACTO_ESTADO_LABEL[estadoAgendamento]}` : ''}
                {linked ? ` · Processo ${linked.processo}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {podeGuardar && (
              <button onClick={handleGuardar} disabled={saving} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60" style={{ fontSize: '13px', fontWeight: 500 }}>
                <Save className="w-4 h-4" /> <span className="hidden sm:inline">{saving ? 'A guardar…' : 'Guardar'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-1 mt-4 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${active ? 'bg-teal-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                style={{ fontSize: '13px', fontWeight: active ? 600 : 500 }}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <div className="max-w-3xl mb-4">
          {anulacao.anulado ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200">
              <Ban className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600 }}>{t('pages.contacts.form.voidedBanner')}</p>
                <p className="mt-0.5 opacity-90" style={{ fontSize: '13px' }}>{t('pages.contacts.form.voidedBannerDetail')}</p>
              </div>
            </div>
          ) : (
            <FaturacaoAlertBanner
              value={contactFaturacao}
              context="contacto"
              onGoToFaturacao={() => setTab('faturacao')}
            />
          )}
        </div>

        {tab === 'identificacao' && (
          <div className="space-y-4 max-w-3xl">
            <Section title="Informação Pessoal" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2 md:col-span-3">
                  <label className={labelClass} style={{ fontSize: '13px' }}>Nome completo <span className="text-red-500">*</span></label>
                  <input className={inputClass} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo do paciente" style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Data de Nascimento</label>
                  <input type="date" className={inputClass} value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Género</label>
                  <select className={inputClass} value={form.genero} onChange={(e) => setForm({ ...form, genero: e.target.value })} style={{ fontSize: '14px' }}>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>NIF</label>
                  <input className={inputClass} value={form.nif} onChange={(e) => setForm({ ...form, nif: e.target.value })} placeholder="000000000" style={{ fontSize: '14px', fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Altura (cm)</label>
                  <input type="number" step="0.01" className={inputClass} value={form.altura} onChange={(e) => setForm({ ...form, altura: e.target.value })} placeholder="165" style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Peso (kg)</label>
                  <input type="number" step="0.01" className={inputClass} value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} placeholder="65" style={{ fontSize: '14px' }} />
                </div>
              </div>
            </Section>
            <Section title="Contacto" icon={Phone}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Telemóvel <span className="text-red-500">*</span></label>
                  <input className={inputClass} value={form.telemovel} onChange={(e) => setForm({ ...form, telemovel: e.target.value })} placeholder="+351 900 000 000" style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Email</label>
                  <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" style={{ fontSize: '14px' }} />
                </div>
              </div>
            </Section>
            <Section title="Morada" icon={MapPin}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2 md:col-span-3">
                  <label className={labelClass} style={{ fontSize: '13px' }}>Morada</label>
                  <input className={inputClass} value={form.morada} onChange={(e) => setForm({ ...form, morada: e.target.value })} placeholder="Rua, número, andar" style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Código Postal</label>
                  <input className={inputClass} value={form.codigo_postal} onChange={(e) => handleCodigoPostalChange(e.target.value)} onBlur={(e) => void autofillFromCp(e.target.value)} placeholder="0000-000" style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Cidade</label>
                  <input className={inputClass} value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} placeholder="Cidade" style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Distrito</label>
                  <input className={inputClass} value={form.distrito} onChange={(e) => setForm({ ...form, distrito: e.target.value })} placeholder="Distrito" style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>País</label>
                  <input className={inputClass} value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} placeholder="Portugal" style={{ fontSize: '14px' }} />
                </div>
              </div>
              <p className="text-gray-400 dark:text-gray-500 mt-2" style={{ fontSize: '11px' }}>Distrito/Cidade podem ser preenchidos automaticamente a partir do Código Postal.</p>
            </Section>

            {savedContactId && (
            <Section title={t('pages.contacts.form.voided')} icon={Ban}>
              <div className="space-y-3">
                <label className="inline-flex items-center gap-2.5 text-gray-700 dark:text-gray-300 cursor-pointer" style={{ fontSize: '14px' }}>
                  <input
                    type="checkbox"
                    checked={anulacao.anulado}
                    onChange={(e) => setAnulacao({
                      anulado: e.target.checked,
                      motivo_anulacao_id: e.target.checked ? anulacao.motivo_anulacao_id : '',
                    })}
                    disabled={!canEditFaturacao || temProcessoAtivo}
                    className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                  <span style={{ fontWeight: 500 }}>{t('pages.contacts.form.voided')}</span>
                </label>
                {temProcessoAtivo && (
                  <p className="text-amber-600 dark:text-amber-400 text-xs">
                    Este contacto tem um processo activo. Cancele o processo em Processos para anular aqui ou use os motivos de processo.
                  </p>
                )}

                {anulacao.anulado && (
                  <div className="pl-6 max-w-md">
                    <label className={labelClass} style={{ fontSize: '13px' }}>
                      {t('pages.contacts.form.voidReason')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={inputClass}
                      value={anulacao.motivo_anulacao_id}
                      onChange={(e) => setAnulacao({ ...anulacao, motivo_anulacao_id: e.target.value })}
                      disabled={!canEditFaturacao}
                      style={{ fontSize: '14px' }}
                    >
                      <option value="">{t('pages.contacts.form.selectVoidReason')}</option>
                      {motivosAtivos.map((m) => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                    {motivosAtivos.length === 0 && (
                      <p className="text-amber-600 dark:text-amber-400 mt-1" style={{ fontSize: '11px' }}>
                        Sem motivos configurados. Adicione em Administração → Motivos de anulação.
                      </p>
                    )}
                    <p className="text-gray-500 dark:text-gray-400 mt-2" style={{ fontSize: '12px' }}>
                      {t('pages.contacts.form.voidHint')}
                    </p>
                  </div>
                )}
              </div>
            </Section>
            )}
          </div>
        )}

        {tab === 'gravidez' && (
          <div className="space-y-4 max-w-3xl">
            <Section title="Gravidez" icon={Baby}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Médico</label>
                  <select
                    className={inputClass}
                    value={gravidez.medico_id}
                    onChange={(e) => setGravidez({ ...gravidez, medico_id: e.target.value, entidade_id: '' })}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">Selecione...</option>
                    {medicos.filter((m) => m.ativo !== false).map((m) => (
                      <option key={m.utilizador_id} value={m.utilizador_id}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Onde é seguida</label>
                  <select
                    className={`${inputClass} ${!gravidez.medico_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                    value={gravidez.entidade_id}
                    onChange={(e) => setGravidez({ ...gravidez, entidade_id: e.target.value })}
                    disabled={!gravidez.medico_id}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">
                      {gravidez.medico_id ? 'Selecione a entidade...' : 'Selecione primeiro o médico...'}
                    </option>
                    {entidadesDoMedico.map((local) => (
                      <option key={local.entidade_id} value={local.entidade_id}>
                        {local.entidade_nome}{local.entidade_cidade ? ` — ${local.entidade_cidade}` : ''}
                      </option>
                    ))}
                  </select>
                  {gravidez.medico_id && entidadesDoMedico.length === 0 && (
                    <p className="text-amber-600 dark:text-amber-400 mt-1" style={{ fontSize: '11px' }}>
                      Este médico não tem entidades associadas. Configure em Administração → Médicos.
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Teste</label>
                  <select
                    className={inputClass}
                    value={gravidez.teste_pai_id}
                    onChange={(e) => setGravidez({ ...gravidez, teste_pai_id: e.target.value, teste_id: '' })}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">Selecione...</option>
                    {testesComSubTestes.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>{t('pages.contacts.form.pack')}</label>
                  <select
                    className={`${inputClass} ${!gravidez.teste_pai_id ? 'opacity-60 cursor-not-allowed' : ''}`}
                    value={gravidez.teste_id}
                    onChange={(e) => setGravidez({ ...gravidez, teste_id: e.target.value })}
                    disabled={!gravidez.teste_pai_id}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">
                      {gravidez.teste_pai_id ? t('pages.contacts.form.selectPack') : t('pages.contacts.form.selectTestFirst')}
                    </option>
                    {subTestesDoPai.map((st) => (
                      <option key={st.id} value={st.id}>{st.nome}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-1">
                    {t('pages.contacts.form.packHint')}
                  </p>
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Tipo de gravidez</label>
                  <select className={inputClass} value={gravidez.tipo_gravidez} onChange={(e) => setGravidez({ ...gravidez, tipo_gravidez: e.target.value })} style={{ fontSize: '14px' }}>
                    <option value="Singular">Singular</option>
                    <option value="Gemelar">Gemelar</option>
                  </select>
                </div>
                <GestacaoFields
                  semanasRegisto={gravidez.gestacao_semanas_registo}
                  diasRegisto={gravidez.gestacao_dias_registo}
                  dataRegisto={gestacaoDataRegisto}
                  onSemanasChange={(value) => setGravidez({ ...gravidez, gestacao_semanas_registo: value })}
                  onDiasChange={(value) => setGravidez({ ...gravidez, gestacao_dias_registo: value })}
                  labelClass={labelClass}
                  inputClass={inputClass}
                />
              </div>
              <p className="text-gray-400 dark:text-gray-500 mt-3" style={{ fontSize: '12px' }}>
                O Médico e o Teste são usados uma única vez: ao associar o kit na colheita, o contacto passa a processo e deixa de aparecer em Contactos.
              </p>
            </Section>
          </div>
        )}

        {tab === 'colheita' && (
          <div className="space-y-4 max-w-3xl">
            <Section title="Local de Colheita" icon={Syringe}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Posto de Colheita <span className="text-red-500">*</span></label>
                  <select
                    className={`${inputClass} ${!contactoTemMoradaParaColheita ? 'opacity-60 cursor-not-allowed' : ''}`}
                    value={colheita.posto_id}
                    onChange={(e) => setColheita({ ...colheita, posto_id: e.target.value })}
                    disabled={!contactoTemMoradaParaColheita}
                    style={{ fontSize: '14px' }}
                  >
                    <option value="">
                      {!form.morada?.trim()
                        ? 'Preencha primeiro a morada...'
                        : !hasValidContactPostalCode(form.codigo_postal)
                          ? 'Preencha primeiro o código postal...'
                          : 'Selecione o posto...'}
                    </option>
                    {postosProximos.map(({ posto, motivo }) => (
                      <option key={posto.id} value={posto.id}>
                        {posto.nome}
                        {posto.cidade ? ` — ${posto.cidade}` : ''}
                        {posto.codigo_postal ? ` (${posto.codigo_postal})` : ''}
                        {` · ${formatPostoProximidadeMotivo(motivo)}`}
                      </option>
                    ))}
                  </select>
                  {!contactoTemMoradaParaColheita && (
                    <p className="text-gray-500 dark:text-gray-400 mt-1" style={{ fontSize: '11px' }}>
                      Indique a morada e o código postal no separador Identificação para ver postos de colheita próximos.
                    </p>
                  )}
                  {contactoTemMoradaParaColheita && (
                    <p className="text-gray-500 dark:text-gray-400 mt-1" style={{ fontSize: '11px' }}>
                      São listados postos do mesmo distrito, da mesma cidade ou com código postal próximo — ordenados do mais perto ao mais longe.
                    </p>
                  )}
                  {contactoTemMoradaParaColheita && postosProximos.length === 0 && (
                    <p className="text-amber-600 dark:text-amber-400 mt-1" style={{ fontSize: '11px' }}>
                      Não existem postos de colheita próximos desta morada. Configure postos com código postal em Administração → Laboratórios.
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Data Prevista da Colheita <span className="text-red-500">*</span></label>
                  <input type="date" className={inputClass} value={colheita.data_prevista} onChange={(e) => setColheita({ ...colheita, data_prevista: e.target.value })} style={{ fontSize: '14px' }} />
                </div>
              </div>

              {/* Validação de stock */}
              {colheita.posto_id && colheita.data_prevista && (
                <div className="mt-3">
                  {!gravidez.teste_id ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400" style={{ fontSize: '12px' }}>
                      <AlertTriangle className="w-4 h-4" /> {t('pages.contacts.form.selectPackStock')}
                    </div>
                  ) : checkingStock ? (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400" style={{ fontSize: '12px' }}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> A verificar stock do posto…
                    </div>
                  ) : stockInfo && stockInfo.disponiveis > 0 ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" style={{ fontSize: '12px' }}>
                      <CheckCircle2 className="w-4 h-4" /> {stockInfo.disponiveis} kit(s) de {testeSelecionadoNome || 'teste seleccionado'} disponível(eis) neste posto.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" style={{ fontSize: '12px' }}>
                      <AlertTriangle className="w-4 h-4" /> Atenção: o posto {postos.find((p) => p.id === colheita.posto_id)?.nome || ''} não possui kits de {testeSelecionadoNome || 'teste seleccionado'} para a data selecionada. O registo não é bloqueado.
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Data Efetiva da Colheita</label>
                  <input type="date" className={inputClass} value={colheita.data_efetiva} disabled={!!linked} onChange={(e) => void handleDataEfetiva(e.target.value)} style={{ fontSize: '14px' }} />
                  <p className="text-gray-400 dark:text-gray-500 mt-1" style={{ fontSize: '11px' }}>Ao preencher, será pedida a seleção de um kit disponível do posto.</p>
                </div>
                {linked && (
                  <div className="flex items-end">
                    <div className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400" style={{ fontSize: '12px' }}>
                      <Package className="w-4 h-4" /> Kit {linked.kit} associado · Processo {linked.processo} criado.
                    </div>
                  </div>
                )}
              </div>
            </Section>
          </div>
        )}

        {tab === 'faturacao' && (
          <div className="space-y-4 max-w-3xl">
            <Section title="Faturação" icon={Receipt}>
              <p className="text-gray-500 dark:text-gray-400 mb-4" style={{ fontSize: '13px' }}>
                Emita a fatura ao criar o contacto. Os dados são transferidos para o processo após a colheita.
              </p>
              <ProcessFaturacaoFields
                value={contactFaturacao}
                onChange={setContactFaturacao}
                canUpdate={canEditFaturacao}
              />
            </Section>
          </div>
        )}

        {tab === 'notas' && (
          <div className="space-y-4 max-w-3xl">
            <Section title="Notas" icon={StickyNote}>
              <textarea className={inputClass} rows={6} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas internas do contacto (copiadas para o processo na colheita)" style={{ fontSize: '14px' }} />
            </Section>
          </div>
        )}

        {tab === 'anexos' && (
          <div className="space-y-4 max-w-3xl">
            {savedContactId ? (
              <AnexosTab
                pacienteId={savedContactId}
                canUpdate={canUpdate || canCreate}
                canDelete={canUpdate}
                getAnexos={getAnexosByPaciente}
                addAnexo={addAnexo}
                deleteAnexo={deleteAnexo}
              />
            ) : (
              <Section title="Anexos" icon={Paperclip}>
                <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '13px' }}>Guarde o contacto primeiro para poder adicionar anexos.</p>
              </Section>
            )}
          </div>
        )}
      </div>

      {/* Modal de seleção de kit */}
      {kitModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-gray-900 dark:text-gray-100" style={{ fontSize: '16px', fontWeight: 600 }}>Selecionar kit disponível</h2>
              <button onClick={() => { setKitModal({ open: false, loading: false, kits: [] }); setLabPreview(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {labPreview && (
                <div className="mb-4 px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-900/20 border border-teal-100 dark:border-teal-800">
                  <p className="text-teal-800 dark:text-teal-300" style={{ fontSize: '12px' }}>
                    Laboratório final previsto: <strong>{labPreview.nome}</strong>
                    {labPreview.codigo ? ` (${labPreview.codigo})` : ''}
                  </p>
                </div>
              )}
              {kitModal.loading ? (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 py-6 justify-center" style={{ fontSize: '13px' }}>
                  <Loader2 className="w-4 h-4 animate-spin" /> A carregar kits…
                </div>
              ) : kitModal.kits.length === 0 ? (
                <div className="py-8 text-center">
                  <Package className="w-8 h-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '13px' }}>
                    Sem kits de {testeSelecionadoNome || 'teste seleccionado'} disponíveis neste posto.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {kitModal.kits.map((k) => (
                    <button key={k.id} onClick={() => void handleSelecionarKit(k)} className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-colors text-left">
                      <div>
                        <div className="text-gray-900 dark:text-gray-100" style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace' }}>{k.codigo_barras}</div>
                        <div className="text-gray-400 dark:text-gray-500" style={{ fontSize: '11px' }}>
                          {k.teste_nome || k.tipo_kit || 'Kit'}{k.data_validade ? ` · validade ${new Date(k.data_validade).toLocaleDateString('pt-PT')}` : ''}
                        </div>
                      </div>
                      <Package className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
