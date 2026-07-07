import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Save, User, MapPin, Baby, Syringe, Receipt, StickyNote, Paperclip,
  AlertTriangle, CheckCircle2, Package, X, Loader2, Ban, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { createPostalCodeAutofillHandlers } from '../../lib/postal-code-pt';
import { ORIGEM_CONCEICAO_OPTIONS } from '../../lib/origem-conceicao';
import { filterPostosNearContact, formatPostoOptionLabel, formatPostoProximidadeMotivo, hasValidContactPostalCode } from '../../lib/posto-proximity';
import { getTestesComSubTestes, getTestesSelecionaveisComLabel, resolveParentFromTesteId, resolvePrecoTesteSelecionavel, resolveTesteSelecionavelLabel } from '../../lib/testes';
import { Contact, Processo } from '../data/types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { apiRequest } from '../../lib/api';
import { getAuthToken } from '../../lib/api-processos';
import { navigateToProcessoFromContact } from '../../lib/contact-processo-redirect';
import { buildContactClinicalPayload, buildContactPosConversao, contactTemProcessoAtivo,
  findProcessoDoContacto, isProcessoLaboratorio,
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
import { AnexosTab, DetailPanel, DetailSection, DetailDivider } from './ContactDetail';
import { GestacaoFields } from './GestacaoFields';
import { ProcessFaturacaoFields } from './shared/ProcessFaturacaoFields';
import { FaturacaoAlertBanner } from './shared/FaturacaoAlertBanner';
import { FormAvatarInitials, FormField, FormFieldAccessory, FormInlineAlert, FormInput, FormNumberInput, FormPageBody, FormPageHeader, FormPageShell, FormPrimaryButton, FormRadixSelect, FormSectionNote, FormTabContent, FormTextarea } from './shared/FormPageChrome';
import { FormDatePicker } from './shared/FormDatePicker';
import { AppModal, ModalActions, ModalAlert } from './shared/AppModal';
import { Medico, medicosApi } from '../../lib/api-medicos';
import { parseGestacaoRegistoInput } from '../../lib/gestacao';
import { CHECKBOX_INPUT_CLASS } from '../../lib/design-system';
import { CONTROL, FORM } from '../../lib/design-tokens';
import { CONTACT_TAB_IDS, withRecordQuery, type ContactTabId } from '../../lib/record-tabs';

export type ContactFormEditHandle = {
  save: () => Promise<boolean>;
  cancel: () => void;
};

type ContactFormPageProps = {
  embedded?: boolean;
  contactId?: string;
  activeTab?: ContactTabId;
  onSaveComplete?: () => void;
  editRef?: MutableRefObject<ContactFormEditHandle | null>;
  onTabChangeRequest?: (tab: ContactTabId) => void;
};

type TabId = ContactTabId;

const emptyForm: Omit<Contact, 'id' | 'created_at'> = {
  nome: '', data_nascimento: '', genero: 'Feminino', nif: '', telemovel: '', email: '', morada: '',
  codigo_postal: '', pais: '', distrito: '', cidade: '', altura: '', peso: '',
};

const today = todayLocal;

const emptyGravidez = {
  medico_id: '', entidade_id: '', onde_seguida: '', teste_pai_id: '', teste_id: '', tipo_gravidez: 'Singular',
  origem_conceicao: 'natural', quer_saber_sexo: false,
  gestacao_semanas_registo: '', gestacao_dias_registo: '', gestacao_registada_em: '',
};
const emptyColheita = { posto_id: '', data_prevista: '', data_efetiva: '' };

interface KitOpcao { id: string; codigo_barras: string; tracking: string; tipo_kit: string; teste_nome?: string; data_validade: string }

const inputClass = CONTROL.input;

export function ContactFormPage({
  embedded = false,
  contactId: contactIdProp,
  activeTab: activeTabProp,
  onSaveComplete,
  editRef,
  onTabChangeRequest,
}: ContactFormPageProps = {}) {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const id = embedded ? contactIdProp : routeId;
  const { t, localeTag } = useLanguage();
  const {
    contacts, addContact, updateContact, processos, addProcesso, updateProcesso,
    postos, testes, motivosAnulacao, getPostoStock, getPostoKitsDisponiveis, marcarKitUtilizado,
    getAnexosByPaciente, uploadAnexoFile, deleteAnexo,
  } = useData();
  const { hasPermission, role, currentUser } = useAuth();
  const canUpdate = hasPermission('contactos', 'update');
  const canCreate = hasPermission('contactos', 'create');
  const canUpdateProcesso = hasPermission('processos', 'update');

  const editing = Boolean(id);
  const [internalTab, setInternalTab] = useState<TabId>('identificacao');
  const tab = embedded ? (activeTabProp ?? 'identificacao') : internalTab;

  const focusTab = (next: TabId) => {
    if (embedded && onTabChangeRequest) onTabChangeRequest(next);
    else setInternalTab(next);
  };

  const tabs = useMemo(() => [
    { id: 'identificacao' as const, label: t('form.tabs.identificacao'), icon: User },
    { id: 'gravidez' as const, label: t('form.tabs.gravidez'), icon: Baby },
    { id: 'colheita' as const, label: t('form.tabs.colheita'), icon: Syringe },
    { id: 'faturacao' as const, label: t('form.tabs.faturacao'), icon: Receipt },
    { id: 'notas' as const, label: t('form.tabs.notas'), icon: StickyNote },
    { id: 'anexos' as const, label: t('form.tabs.anexos'), icon: Paperclip },
  ], [t]);

  const origemConceicaoOptions = useMemo(
    () => ORIGEM_CONCEICAO_OPTIONS.map((item) => ({
      value: item.value,
      label: t(`form.options.conceptionOrigin.${item.value}`),
    })),
    [t],
  );

  useEffect(() => {
    if (embedded) return;
    const requested = searchParams.get('tab');
    if (requested && CONTACT_TAB_IDS.has(requested as TabId)) {
      setInternalTab(requested as TabId);
    }
  }, [embedded, searchParams]);

  const handleTabChange = (next: TabId) => {
    if (embedded) return;
    setInternalTab(next);
    setSearchParams(next === 'identificacao' ? {} : { tab: next }, { replace: true });
  };

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
  const [kitPendingConfirm, setKitPendingConfirm] = useState<KitOpcao | null>(null);
  const [creatingProcesso, setCreatingProcesso] = useState(false);
  const [labPreview, setLabPreview] = useState<{ id: string; nome: string; codigo?: string } | null>(null);
  const [linked, setLinked] = useState<{ kit: string; processo: string } | null>(null);
  const [estadoAgendamento, setEstadoAgendamento] = useState<Contact['estado_agendamento']>(null);
  const [mostrarTodosPostos, setMostrarTodosPostos] = useState(false);
  const [postoSelectOpen, setPostoSelectOpen] = useState(false);

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
  const postosDropdownOptions = useMemo(() => {
    if (!contactoTemMoradaParaColheita) return [];

    if (mostrarTodosPostos) {
      return postosAtivos
        .slice()
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt'))
        .map((posto) => ({
          value: posto.id,
          label: formatPostoOptionLabel(posto),
        }));
    }

    return postosProximos.map(({ posto, motivo }) => ({
      value: posto.id,
      label: `${formatPostoOptionLabel(posto)} · ${formatPostoProximidadeMotivo(motivo)}`,
    }));
  }, [contactoTemMoradaParaColheita, mostrarTodosPostos, postosAtivos, postosProximos]);
  const testesComSubTestes = useMemo(() => getTestesComSubTestes(testes), [testes]);
  const subTestesDoPai = useMemo(() => {
    const pai = testesComSubTestes.find((t) => t.id === gravidez.teste_pai_id);
    return (pai?.sub_testes || []).filter((st) => st.ativo !== false);
  }, [testesComSubTestes, gravidez.teste_pai_id]);
  const kitStockLabel = useMemo(() => {
    const parent = resolveParentFromTesteId(testes, gravidez.teste_id);
    return parent?.tipo_kit || parent?.nome || 'Maternity';
  }, [testes, gravidez.teste_id]);
  const entidadesDoMedico = useMemo(() => {
    if (!gravidez.medico_id) return [];
    const medico = medicos.find((m) => m.utilizador_id === gravidez.medico_id);
    return medico?.locais_trabalho || [];
  }, [gravidez.medico_id, medicos]);

  const medicoLogado = useMemo(() => {
    if (role !== 'Medico' || !currentUser?.id) return null;
    return medicos.find((m) => m.utilizador_id === currentUser.id) ?? null;
  }, [role, currentUser?.id, medicos]);

  const medicoFieldLocked = Boolean(medicoLogado?.utilizador_id);

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
  const moradaSnapshotRef = useRef<string | null>(null);

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
      origem_conceicao: c.origem_conceicao || 'natural',
      quer_saber_sexo: !!c.quer_saber_sexo,
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
    moradaSnapshotRef.current = null;
    setMostrarTodosPostos(false);
    setSavedContactId(null);
    setForm(emptyForm);
    setGravidez(emptyGravidez);
    setColheita(emptyColheita);
    setNotas('');
    setEstadoAgendamento(null);
    setLinked(null);
    setContactFaturacao(emptyProcessFaturacao());
    setAnulacao({ anulado: false, motivo_anulacao_id: '' });
    setInternalTab('identificacao');
  }, [id]);

  // Contacto ja convertido em processo → redirecionar para ficha de consulta
  useEffect(() => {
    if (!id || !contactTemProcessoAtivo(id, processos)) return;
    const proc = findProcessoDoContacto(id, processos);
    if (!proc) return;
    navigateToProcessoFromContact(navigate, proc.id, { replace: true });
  }, [id, processos, navigate]);

  // Carregar contacto em modo edição (uma vez por id — evita apagar campos ao refrescar a lista)
  useEffect(() => {
    if (!id) {
      hydratedIdRef.current = null;
      moradaSnapshotRef.current = null;
      return;
    }
    if (contactTemProcessoAtivo(id, processos)) return;
    if (hydratedIdRef.current === id) return;

    moradaSnapshotRef.current = null;
    setMostrarTodosPostos(false);

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

  // Perfil Médico: campo fixo com o utilizador autenticado
  useEffect(() => {
    if (!medicoLogado?.utilizador_id) return;
    if (gravidez.medico_id === medicoLogado.utilizador_id) return;
    setGravidez((prev) => ({
      ...prev,
      medico_id: medicoLogado.utilizador_id,
      entidade_id: prev.medico_id === medicoLogado.utilizador_id ? prev.entidade_id : '',
    }));
  }, [medicoLogado, gravidez.medico_id]);

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

  // Preservar postos distantes já guardados; limpar apenas quando a morada muda
  useEffect(() => {
    const moradaKey = `${form.morada}|${form.codigo_postal}|${form.distrito}|${form.cidade}`;
    if (moradaSnapshotRef.current === null) {
      moradaSnapshotRef.current = moradaKey;
      return;
    }
    if (moradaSnapshotRef.current === moradaKey) return;
    moradaSnapshotRef.current = moradaKey;
    setMostrarTodosPostos(false);
    setColheita((prev) => {
      if (!prev.posto_id || !contactoTemMoradaParaColheita) return prev;
      const stillNearby = postosProximos.some(({ posto }) => posto.id === prev.posto_id);
      return stillNearby ? prev : { ...prev, posto_id: '' };
    });
  }, [form.morada, form.codigo_postal, form.distrito, form.cidade, contactoTemMoradaParaColheita, postosProximos]);

  // Limpar posto selecionado quando deixa de ser válido para o modo actual
  useEffect(() => {
    if (!colheita.posto_id) return;
    if (!contactoTemMoradaParaColheita) {
      setColheita((prev) => (prev.posto_id ? { ...prev, posto_id: '' } : prev));
      return;
    }
    if (mostrarTodosPostos) {
      const stillActive = postosAtivos.some((posto) => posto.id === colheita.posto_id);
      if (!stillActive) {
        setColheita((prev) => ({ ...prev, posto_id: '' }));
      }
      return;
    }
    const stillNearby = postosProximos.some(({ posto }) => posto.id === colheita.posto_id);
    if (stillNearby) return;
    const stillActive = postosAtivos.some((posto) => posto.id === colheita.posto_id);
    if (stillActive) {
      setMostrarTodosPostos(true);
      return;
    }
    setColheita((prev) => ({ ...prev, posto_id: '' }));
  }, [colheita.posto_id, contactoTemMoradaParaColheita, mostrarTodosPostos, postosAtivos, postosProximos]);

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
    if (!form.nome.trim()) { toast.error(t('pages.contacts.form.toast.nameRequired')); focusTab('identificacao'); return false; }
    if (!form.telemovel.trim()) { toast.error(t('pages.contacts.form.toast.phoneRequired')); focusTab('identificacao'); return false; }
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
          toast.error(e instanceof Error ? e.message : t('pages.contacts.form.toast.saveFailed'));
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
      toast.error(e instanceof Error ? e.message : t('pages.contacts.form.toast.saveFailed'));
      return null;
    }
  };

  const handleGuardar = async (): Promise<boolean> => {
    if (!validarIdentificacao()) return false;
    if (anulacao.anulado && !anulacao.motivo_anulacao_id) {
      toast.error(t('pages.contacts.form.voidReasonRequired'));
      focusTab('identificacao');
      return false;
    }
    if (!anulacao.anulado) {
      const fatErr = validateFaturacaoData(contactFaturacao);
      if (fatErr) {
        toast.error(fatErr);
        focusTab('faturacao');
        return false;
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

      toast.success(isNew ? t('pages.contacts.form.toast.created') : t('pages.contacts.form.toast.updated'));

      if (isNew && saved.id && !embedded) {
        hydratedIdRef.current = saved.id;
        navigate(withRecordQuery(`/contactos/${saved.id}`, { edit: true }), { replace: true });
      } else if (embedded && onSaveComplete) {
        onSaveComplete();
      }
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages.contacts.form.toast.saveError'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!id) return;
    const fromList = contacts.find((x) => x.id === id);
    if (fromList) applyContactToForm(fromList);
  };

  useEffect(() => {
    if (!editRef) return;
    editRef.current = { save: handleGuardar, cancel: cancelEdit };
    return () => { editRef.current = null; };
  });

  // Ao preencher a Data Efetiva → abrir modal de seleção de kit
  const handleDataEfetiva = async (value: string) => {
    setColheita((c) => ({ ...c, data_efetiva: value }));
    if (!value || linked) return;
    if (anulacao.anulado) {
      toast.error(t('pages.contacts.form.voidedBannerDetail'));
      setColheita((c) => ({ ...c, data_efetiva: '' }));
      return;
    }
    if (!colheita.posto_id) { toast.error(t('pages.contacts.form.toast.selectPostoFirst')); return; }
    if (!gravidez.medico_id || !gravidez.teste_id) {
      toast.error(t('pages.contacts.form.selectPackGravidez'));
      focusTab('gravidez');
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
      toast.error(e instanceof Error ? e.message : t('pages.contacts.form.toast.loadKitsFailed'));
    }
  };

  const handleConfirmarKit = async () => {
    const kit = kitPendingConfirm;
    if (!kit) return;
    const contactId = savedContactId;
    if (!contactId) { toast.error(t('pages.contacts.form.toast.saveContactFirst')); return; }
    const postoNome = postos.find((p) => p.id === colheita.posto_id)?.nome || '';
    const gestacao = parseGestacaoRegistoInput(gravidez.gestacao_semanas_registo, gravidez.gestacao_dias_registo);
    setCreatingProcesso(true);
    try {
      const colheitaData = colheita.data_efetiva || today();
      const novoProcesso: Omit<Processo, 'id'> = {
        numero: kit.codigo_barras,
        paciente_id: contactId,
        paciente_nome: form.nome,
        medico: medicos.find((m) => m.utilizador_id === gravidez.medico_id)?.nome || '',
        medico_id: gravidez.medico_id,
        posto: postoNome,
        posto_id: colheita.posto_id || undefined,
        kit_codigo: kit.codigo_barras,
        estado: 'Em Analise',
        data_entrada: today(),
        data_colheita: colheitaData,
        data_colheita_prevista: colheita.data_prevista || undefined,
        data_envio_laboratorio: colheitaData,
        teste_id: gravidez.teste_id,
        teste: resolveTesteSelecionavelLabel(testes, gravidez.teste_id),
        observacoes: notas || undefined,
        onde_seguida: ondeSeguidaNome || undefined,
        tipo_gravidez: gravidez.tipo_gravidez === 'Gemelar' ? 'gemelar' : gravidez.tipo_gravidez === 'Singular' ? 'singular' : null,
        origem_conceicao: gravidez.origem_conceicao || null,
        quer_saber_sexo: gravidez.quer_saber_sexo,
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
      setKitPendingConfirm(null);
      setLabPreview(null);
      setLinked({ kit: kit.codigo_barras, processo: processo.numero });
      toast.success(t('pages.contacts.form.toast.processCreated', { processo: processo.numero, kit: kit.codigo_barras }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('pages.contacts.form.toast.kitAssociateFailed'));
    } finally {
      setCreatingProcesso(false);
    }
  };

  const initials = (form.nome || t('pages.contacts.form.header.newContact')).split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const podeGuardar = savedContactId ? canUpdate : canCreate;

  const subtitleParts = [
    editing ? t('pages.contacts.form.header.editMode') : t('pages.contacts.form.header.createMode'),
    estadoAgendamento ? t('form.options.schedulingState.scheduled') : '',
    linked ? t('pages.contacts.form.header.processLinked', { processo: linked.processo }) : '',
  ].filter(Boolean);

  const tabPanels = (
    <>
        <FormTabContent>
          {anulacao.anulado ? (
            <div className="flex items-start gap-3 px-4 py-3 rounded-lg border bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200/90">
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
              onGoToFaturacao={() => handleTabChange('faturacao')}
            />
          )}
        </FormTabContent>

        {tab === 'identificacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('pages.contacts.form.sections.contactData')} icon={User}>
                <div className={FORM.fieldRow}>
                  <FormField label={t('form.fields.fullName')} required width="2xl">
                    <FormInput
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder={t('form.placeholders.fullName')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.birthDate')} width="sm">
                    <FormDatePicker
                      value={form.data_nascimento}
                      onChange={(v) => setForm({ ...form, data_nascimento: v })}
                      placeholder={t('form.placeholders.date')}
                      fromYear={1920}
                      maxDate={today()}
                    />
                  </FormField>
                  <FormField label={t('form.fields.gender')} width="md">
                    <FormRadixSelect
                      value={form.genero}
                      onChange={(v) => setForm({ ...form, genero: v })}
                      options={[
                        { value: 'Feminino', label: t('form.options.gender.female') },
                        { value: 'Masculino', label: t('form.options.gender.male') },
                      ]}
                    />
                  </FormField>
                  <FormField label={t('form.fields.nif')} width="md">
                    <FormInput
                      className="font-mono tabular-nums"
                      value={form.nif}
                      onChange={(e) => setForm({ ...form, nif: e.target.value })}
                      placeholder={t('form.placeholders.nif')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.phone')} required width="lg">
                    <FormInput
                      value={form.telemovel}
                      onChange={(e) => setForm({ ...form, telemovel: e.target.value })}
                      placeholder={t('form.placeholders.phone')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.email')} width="xl">
                    <FormInput
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder={t('form.placeholders.email')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.height')} width="xs">
                    <FormNumberInput
                      value={form.altura}
                      onChange={(e) => setForm({ ...form, altura: e.target.value.replace(/[^\d.,]/g, '') })}
                      placeholder={t('form.placeholders.height')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.weight')} width="xs">
                    <FormNumberInput
                      value={form.peso}
                      onChange={(e) => setForm({ ...form, peso: e.target.value.replace(/[^\d.,]/g, '') })}
                      placeholder={t('form.placeholders.weight')}
                    />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title={t('pages.contacts.form.sections.address')} icon={MapPin}>
                <div className={FORM.fieldRow}>
                  <FormField label={t('form.fields.address')} width="3xl">
                    <FormInput
                      value={form.morada}
                      onChange={(e) => setForm({ ...form, morada: e.target.value })}
                      placeholder={t('form.placeholders.address')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.postalCode')} width="sm">
                    <FormInput
                      className="font-mono tabular-nums"
                      value={form.codigo_postal}
                      onChange={(e) => handleCodigoPostalChange(e.target.value)}
                      onBlur={(e) => void autofillFromCp(e.target.value)}
                      placeholder={t('form.placeholders.postalCode')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.city')} width="lg">
                    <FormInput
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      placeholder={t('form.placeholders.city')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.district')} width="lg">
                    <FormInput
                      value={form.distrito}
                      onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                      placeholder={t('form.placeholders.district')}
                    />
                  </FormField>
                  <FormField label={t('form.fields.country')} width="md">
                    <FormInput
                      value={form.pais}
                      onChange={(e) => setForm({ ...form, pais: e.target.value })}
                      placeholder={t('form.placeholders.country')}
                    />
                  </FormField>
                </div>
                <p className={`${FORM.hint} mt-3`}>
                  {t('pages.contacts.form.hints.postalAutofill')}
                </p>
              </DetailSection>

              {savedContactId && (
                <>
                  <DetailDivider />
                  <DetailSection title={t('pages.contacts.form.voided')} icon={Ban}>
                    <div className="space-y-3">
                      <label className={`${FORM.checkboxRow} inline-flex`}>
                        <input
                          type="checkbox"
                          checked={anulacao.anulado}
                          onChange={(e) => setAnulacao({
                            anulado: e.target.checked,
                            motivo_anulacao_id: e.target.checked ? anulacao.motivo_anulacao_id : '',
                          })}
                          disabled={!canEditFaturacao || temProcessoAtivo}
                          className={CHECKBOX_INPUT_CLASS}
                        />
                        <span className="font-medium">{t('pages.contacts.form.voided')}</span>
                      </label>
                      {temProcessoAtivo && (
                        <p className="text-amber-600 dark:text-amber-400 text-xs">
                          {t('pages.contacts.form.hints.activeProcessVoid')}
                        </p>
                      )}

                      {anulacao.anulado && (
                        <div className="max-w-md">
                          <FormField label={t('pages.contacts.form.voidReason')} required width="full">
                            <FormRadixSelect
                              value={anulacao.motivo_anulacao_id}
                              onChange={(v) => setAnulacao({ ...anulacao, motivo_anulacao_id: v })}
                              disabled={!canEditFaturacao}
                              placeholder={t('pages.contacts.form.selectVoidReason')}
                              options={motivosAtivos.map((m) => ({ value: m.id, label: m.nome }))}
                            />
                          </FormField>
                          {motivosAtivos.length === 0 && (
                            <p className="text-amber-600 dark:text-amber-400 mt-1 text-xs">
                              {t('pages.contacts.form.hints.noVoidReasons')}
                            </p>
                          )}
                          <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs">
                            {t('pages.contacts.form.voidHint')}
                          </p>
                        </div>
                      )}
                    </div>
                  </DetailSection>
                </>
              )}
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'gravidez' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('pages.contacts.form.sections.clinicalFollowUp')} icon={User}>
                <div className={FORM.fieldRow}>
                  <FormField label={t('form.fields.doctor')} width="lg">
                    {medicoFieldLocked ? (
                      <FormInput
                        readOnly
                        disabled
                        value={medicoLogado?.nome || currentUser?.nome || ''}
                      />
                    ) : (
                      <FormRadixSelect
                        value={gravidez.medico_id}
                        onChange={(v) => setGravidez({ ...gravidez, medico_id: v, entidade_id: '' })}
                        placeholder={t('form.placeholders.selectDoctor')}
                        options={medicos.filter((m) => m.ativo !== false).map((m) => ({
                          value: m.utilizador_id,
                          label: m.nome,
                        }))}
                      />
                    )}
                  </FormField>
                  <FormField
                    label={t('form.fields.followUpLocation')}
                    width="3xl"
                    hint={gravidez.medico_id && entidadesDoMedico.length === 0
                      ? t('pages.contacts.form.hints.doctorNoEntities')
                      : undefined}
                  >
                    <FormRadixSelect
                      value={gravidez.entidade_id}
                      onChange={(v) => setGravidez({ ...gravidez, entidade_id: v })}
                      disabled={!gravidez.medico_id}
                      placeholder={
                        gravidez.medico_id ? t('form.placeholders.selectEntity') : t('form.placeholders.selectDoctorFirst')
                      }
                      options={entidadesDoMedico.map((local) => ({
                        value: local.entidade_id,
                        label: `${local.entidade_nome}${local.entidade_cidade ? ` — ${local.entidade_cidade}` : ''}`,
                      }))}
                    />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title={t('pages.contacts.form.sections.testAndPack')} icon={Package}>
                <div className={FORM.fieldRow}>
                  <FormField label={t('form.fields.test')} width="lg">
                    <FormRadixSelect
                      value={gravidez.teste_pai_id}
                      onChange={(v) => setGravidez({ ...gravidez, teste_pai_id: v, teste_id: '' })}
                      placeholder={t('form.placeholders.selectTest')}
                      options={testesComSubTestes.map((teste) => ({ value: teste.id, label: teste.nome }))}
                    />
                  </FormField>
                  <FormField
                    label={t('pages.contacts.form.pack')}
                    width="lg"
                  >
                    <FormRadixSelect
                      value={gravidez.teste_id}
                      onChange={(v) => setGravidez({ ...gravidez, teste_id: v })}
                      disabled={!gravidez.teste_pai_id}
                      placeholder={
                        gravidez.teste_pai_id ? t('pages.contacts.form.selectPack') : t('pages.contacts.form.selectTestFirst')
                      }
                      options={subTestesDoPai.map((st) => ({ value: st.id, label: st.nome }))}
                    />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title={t('pages.contacts.form.sections.pregnancy')} icon={Baby}>
                <div className={FORM.fieldRow}>
                  <FormField label={t('form.fields.pregnancyType')} width="md">
                    <FormRadixSelect
                      value={gravidez.tipo_gravidez}
                      onChange={(v) => setGravidez({ ...gravidez, tipo_gravidez: v })}
                      options={[
                        { value: 'Singular', label: t('form.options.pregnancyType.singular') },
                        { value: 'Gemelar', label: t('form.options.pregnancyType.twin') },
                      ]}
                    />
                  </FormField>
                  <FormField label={t('form.fields.conceptionOrigin')} width="xl">
                    <FormRadixSelect
                      value={gravidez.origem_conceicao}
                      onChange={(v) => setGravidez({ ...gravidez, origem_conceicao: v })}
                      options={origemConceicaoOptions}
                    />
                  </FormField>
                  <FormField label={t('form.fields.preferences')} width="lg" controlClassName="flex items-center">
                    <label className={`${FORM.checkboxRow} inline-flex`}>
                      <input
                        type="checkbox"
                        checked={gravidez.quer_saber_sexo}
                        onChange={(e) => setGravidez({ ...gravidez, quer_saber_sexo: e.target.checked })}
                        className={CHECKBOX_INPUT_CLASS}
                      />
                      <span>{t('pages.contacts.form.hints.wantsGender')}</span>
                    </label>
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title={t('pages.contacts.form.sections.gestation')} icon={CalendarDays}>
                <GestacaoFields
                  semanasRegisto={gravidez.gestacao_semanas_registo}
                  diasRegisto={gravidez.gestacao_dias_registo}
                  dataRegisto={gestacaoDataRegisto}
                  onSemanasChange={(value) => setGravidez({ ...gravidez, gestacao_semanas_registo: value })}
                  onDiasChange={(value) => setGravidez({ ...gravidez, gestacao_dias_registo: value })}
                  inputClass={inputClass}
                />
              </DetailSection>

              <div className="px-5 pb-5 sm:px-6">
                <FormSectionNote>
                  {t('pages.contacts.form.hints.medicTestOnce')}
                </FormSectionNote>
              </div>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'colheita' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('pages.contacts.form.sections.scheduling')} icon={Syringe}>
                <div className={FORM.fieldRow}>
                  <FormField
                    label={t('form.fields.collectionSite')}
                    required
                    width="3xl"
                    hint={
                      !contactoTemMoradaParaColheita
                        ? t('pages.contacts.form.hints.postoNeedAddress')
                        : mostrarTodosPostos
                          ? t('pages.contacts.form.hints.postoShowAll')
                          : contactoTemMoradaParaColheita && postosProximos.length === 0
                            ? t('pages.contacts.form.hints.postoNoNearby')
                            : t('pages.contacts.form.hints.postoNearby')
                    }
                  >
                    <FormRadixSelect
                      value={colheita.posto_id}
                      onChange={(v) => setColheita({ ...colheita, posto_id: v })}
                      disabled={!contactoTemMoradaParaColheita}
                      open={postoSelectOpen}
                      onOpenChange={setPostoSelectOpen}
                      placeholder={
                        !form.morada?.trim()
                          ? t('form.placeholders.fillAddressFirst')
                          : !hasValidContactPostalCode(form.codigo_postal)
                            ? t('form.placeholders.fillPostalCodeFirst')
                            : t('form.placeholders.selectSite')
                      }
                      options={postosDropdownOptions}
                      footer={
                        contactoTemMoradaParaColheita && postosAtivos.length > 0 ? (
                          <button
                            type="button"
                            className="w-full rounded-md px-2.5 py-2 text-left text-sm text-teal-700 hover:bg-teal-50 dark:text-teal-300 dark:hover:bg-teal-900/25"
                            onClick={() => setMostrarTodosPostos((prev) => !prev)}
                          >
                            {mostrarTodosPostos ? t('pages.contacts.form.posto.showNearbyOnly') : t('pages.contacts.form.posto.showAll')}
                          </button>
                        ) : undefined
                      }
                    />
                  </FormField>
                  <FormField label={t('form.fields.scheduledCollectionDate')} required width="sm">
                    <FormDatePicker
                      value={colheita.data_prevista}
                      onChange={(v) => setColheita({ ...colheita, data_prevista: v })}
                      allowAnyDate={false}
                      allowExistingPastDate
                      placeholder={t('form.placeholders.date')}
                    />
                  </FormField>
                </div>

                {colheita.posto_id && colheita.data_prevista && (
                  <div className="mt-4">
                    {!gravidez.teste_id ? (
                      <FormInlineAlert tone="warning">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{t('pages.contacts.form.selectPackStock')}</span>
                      </FormInlineAlert>
                    ) : checkingStock ? (
                      <FormInlineAlert tone="info">
                        <Loader2 className="w-4 h-4 shrink-0 animate-spin mt-0.5" />
                        <span>{t('pages.contacts.form.stock.checking')}</span>
                      </FormInlineAlert>
                    ) : stockInfo && stockInfo.disponiveis > 0 ? (
                      <FormInlineAlert tone="success">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{t('pages.contacts.form.stock.available', { count: stockInfo.disponiveis, kitType: kitStockLabel })}</span>
                      </FormInlineAlert>
                    ) : (
                      <FormInlineAlert tone="warning">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          {t('pages.contacts.form.stock.unavailable', {
                            posto: postos.find((p) => p.id === colheita.posto_id)?.nome || '',
                            kitType: kitStockLabel,
                          })}
                        </span>
                      </FormInlineAlert>
                    )}
                  </div>
                )}
              </DetailSection>

              <DetailDivider />

              <DetailSection title={t('pages.contacts.form.sections.effectiveCollection')} icon={Package}>
                <div className={FORM.fieldRow}>
                  <FormField
                    label={t('form.fields.effectiveCollectionDate')}
                    width="sm"
                    hint={t('pages.contacts.form.hints.effectiveDateKit')}
                  >
                    <FormDatePicker
                      value={colheita.data_efetiva}
                      disabled={!!linked}
                      onChange={(v) => void handleDataEfetiva(v)}
                      allowAnyDate={false}
                      allowExistingPastDate
                      placeholder={t('form.placeholders.date')}
                    />
                  </FormField>
                  {linked && (
                    <FormFieldAccessory className="w-full max-w-xl">
                      <FormInlineAlert tone="success">
                        <Package className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{t('pages.contacts.form.kit.linked', { kit: linked.kit, processo: linked.processo })}</span>
                      </FormInlineAlert>
                    </FormFieldAccessory>
                  )}
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'faturacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('pages.contacts.form.sections.billing')} icon={Receipt}>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                  {t('pages.contacts.form.hints.billingIntro')}
                </p>
                <ProcessFaturacaoFields
                  value={contactFaturacao}
                  onChange={setContactFaturacao}
                  canUpdate={canEditFaturacao}
                  showMultibancoEnvio={false}
                />
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'notas' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title={t('pages.contacts.form.sections.internalNotes')} icon={StickyNote}>
                <FormField
                  label={t('form.fields.observations')}
                  width="3xl"
                  hint={t('pages.contacts.form.hints.notesCopied')}
                >
                  <FormTextarea
                    rows={6}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder={t('form.placeholders.internalNotes')}
                  />
                </FormField>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'anexos' && (
          <FormTabContent className="space-y-4">
            {savedContactId ? (
              <AnexosTab
                pacienteId={savedContactId}
                canUpdate={canUpdate || canCreate}
                canDelete={canUpdate}
                getAnexos={getAnexosByPaciente}
                uploadAnexoFile={uploadAnexoFile}
                deleteAnexo={deleteAnexo}
              />
            ) : (
              <DetailPanel>
                <DetailSection title={t('pages.contacts.form.sections.attachments')} icon={Paperclip}>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t('pages.contacts.form.hints.saveForAttachments')}</p>
                </DetailSection>
              </DetailPanel>
            )}
          </FormTabContent>
        )}
    </>
  );

  const modals = (
    <>
      {/* Modal de seleção de kit */}
      {kitModal.open && (
        <AppModal title={t('pages.contacts.form.kit.modalSelectTitle')} onClose={() => { setKitModal({ open: false, loading: false, kits: [] }); setLabPreview(null); }}>
          {labPreview && (
            <ModalAlert>
              {t('pages.contacts.form.kit.labPreview', {
                nome: labPreview.nome,
                codigo: labPreview.codigo ? ` (${labPreview.codigo})` : '',
              })}
            </ModalAlert>
          )}
          {kitModal.loading ? (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-6 justify-center text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> {t('pages.contacts.form.kit.loading')}
            </div>
          ) : kitModal.kits.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                {t('pages.contacts.form.kit.noneAvailable', { kitType: kitStockLabel })}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {kitModal.kits.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setKitPendingConfirm(k)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors text-left"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">{k.codigo_barras}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {k.teste_nome || k.tipo_kit || t('pages.contacts.form.kit.defaultLabel')}
                      {k.data_validade ? t('pages.contacts.form.kit.validity', { date: new Date(k.data_validade).toLocaleDateString(localeTag) }) : ''}
                    </div>
                  </div>
                  <Package className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </button>
              ))}
            </div>
          )}
        </AppModal>
      )}

      {kitPendingConfirm && (
        <AppModal
          title={t('pages.contacts.form.kit.confirmTitle')}
          icon={AlertTriangle}
          iconClassName="text-amber-600 dark:text-amber-400"
          onClose={() => !creatingProcesso && setKitPendingConfirm(null)}
          footer={
            <ModalActions
              onCancel={() => setKitPendingConfirm(null)}
              onSubmit={() => void handleConfirmarKit()}
              cancelLabel={t('pages.contacts.form.kit.chooseOther')}
              submitLabel={creatingProcesso ? t('pages.contacts.form.kit.creatingProcess') : t('pages.contacts.form.kit.confirmCreate')}
              saving={creatingProcesso}
            />
          }
        >
          <ModalAlert tone="warning">
            {t('pages.contacts.form.kit.confirmWarning')}
          </ModalAlert>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('form.fields.kit')}</dt>
              <dd className="font-mono font-semibold text-slate-900 dark:text-slate-100">{kitPendingConfirm.codigo_barras}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('form.fields.patient')}</dt>
              <dd className="text-slate-900 dark:text-slate-100 text-right">{form.nome || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('form.fields.site')}</dt>
              <dd className="text-slate-900 dark:text-slate-100 text-right">
                {postos.find((p) => p.id === colheita.posto_id)?.nome || '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('form.fields.effectiveDate')}</dt>
              <dd className="text-slate-900 dark:text-slate-100">{colheita.data_efetiva || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500 dark:text-slate-400">{t('form.fields.test')}</dt>
              <dd className="text-slate-900 dark:text-slate-100 text-right">
                {resolveTesteSelecionavelLabel(testes, gravidez.teste_id) || '—'}
              </dd>
            </div>
          </dl>
        </AppModal>
      )}
    </>
  );

  if (!embedded && routeId) {
    return (
      <Navigate
        to={withRecordQuery(`/contactos/${routeId}`, {
          tab: searchParams.get('tab'),
          edit: true,
        })}
        replace
      />
    );
  }

  if (embedded) {
    return (
      <>
        {tabPanels}
        {modals}
      </>
    );
  }

  return (
    <FormPageShell>
      <FormPageBody>
        <FormPageHeader
          onBack={() => navigate('/contactos')}
          title={form.nome || (editing ? t('pages.contacts.form.header.editContact') : t('pages.contacts.form.header.newContact'))}
          subtitle={subtitleParts.join(' · ')}
          avatar={<FormAvatarInitials initials={initials || t('pages.contacts.form.header.initialsFallback')} />}
          actions={podeGuardar ? (
            <FormPrimaryButton onClick={() => { void handleGuardar(); }} disabled={saving}>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? t('form.saving') : t('form.save')}</span>
            </FormPrimaryButton>
          ) : undefined}
          tabs={tabs}
          activeTab={tab}
          onTabChange={handleTabChange}
        />
        {tabPanels}
      </FormPageBody>
      {modals}
    </FormPageShell>
  );
}
