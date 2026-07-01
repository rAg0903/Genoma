import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Save, User, MapPin, Baby, Syringe, Receipt, StickyNote, Paperclip,
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
import { navigateToProcessoFromContact } from '../../lib/contact-processo-redirect';
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
import { AnexosTab, DetailPanel, DetailSection, DetailDivider } from './ContactDetail';
import { GestacaoFields } from './GestacaoFields';
import { ProcessFaturacaoFields } from './shared/ProcessFaturacaoFields';
import { FaturacaoAlertBanner } from './shared/FaturacaoAlertBanner';
import { FormAvatarInitials, FormField, FormInlineAlert, FormInput, FormNumberInput, FormPageBody, FormPageHeader, FormPageShell, FormPrimaryButton, FormRadixSelect, FormSectionNote, FormTabContent, FormTextarea } from './shared/FormPageChrome';
import { FormDatePicker } from './shared/FormDatePicker';
import { AppModal, ModalAlert } from './shared/AppModal';
import { Medico, medicosApi } from '../../lib/api-medicos';
import { parseGestacaoRegistoInput } from '../../lib/gestacao';
import { CHECKBOX_INPUT_CLASS } from '../../lib/design-system';
import { CONTROL, FORM } from '../../lib/design-tokens';

type TabId = 'identificacao' | 'gravidez' | 'colheita' | 'faturacao' | 'notas' | 'anexos';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'gravidez', label: 'Gravidez', icon: Baby },
  { id: 'colheita', label: 'Colheita', icon: Syringe },
  { id: 'faturacao', label: 'Faturação', icon: Receipt },
  { id: 'notas', label: 'Notas', icon: StickyNote },
  { id: 'anexos', label: 'Anexos', icon: Paperclip },
];

const inputClass = CONTROL.input;

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

const TAB_IDS = new Set<TabId>(TABS.map((t) => t.id));

export function ContactFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const {
    contacts, addContact, updateContact, processos, addProcesso, updateProcesso,
    postos, testes, motivosAnulacao, getPostoStock, getPostoKitsDisponiveis, marcarKitUtilizado,
    getAnexosByPaciente, addAnexo, deleteAnexo,
  } = useData();
  const { hasPermission, role, currentUser } = useAuth();
  const canUpdate = hasPermission('contactos', 'update');
  const canCreate = hasPermission('contactos', 'create');
  const canUpdateProcesso = hasPermission('processos', 'update');

  const editing = Boolean(id);
  const [tab, setTab] = useState<TabId>('identificacao');

  useEffect(() => {
    const requested = searchParams.get('tab');
    if (requested && TAB_IDS.has(requested as TabId)) {
      setTab(requested as TabId);
    }
  }, [searchParams]);

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
    <FormPageShell>
      <FormPageBody>
        <FormPageHeader
          onBack={() => navigate('/contactos')}
          title={form.nome || (editing ? 'Editar contacto' : 'Novo Contacto')}
          subtitle={[
            editing ? 'Edição de contacto' : 'Criação de contacto',
            estadoAgendamento ? CONTACTO_ESTADO_LABEL[estadoAgendamento] : '',
            linked ? `Processo ${linked.processo}` : '',
          ].filter(Boolean).join(' · ')}
          avatar={<FormAvatarInitials initials={initials || 'NC'} />}
          actions={podeGuardar ? (
            <FormPrimaryButton onClick={handleGuardar} disabled={saving}>
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">{saving ? 'A guardar…' : 'Guardar'}</span>
            </FormPrimaryButton>
          ) : undefined}
          tabs={TABS}
          activeTab={tab}
          onTabChange={setTab}
        />

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
              onGoToFaturacao={() => setTab('faturacao')}
            />
          )}
        </FormTabContent>

        {tab === 'identificacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Dados do contacto" icon={User}>
                <div className={FORM.fieldRow}>
                  <FormField label="Nome completo" required width="2xl">
                    <FormInput
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                      placeholder="Nome completo do paciente"
                    />
                  </FormField>
                  <FormField label="Data de nascimento" width="sm">
                    <FormDatePicker
                      value={form.data_nascimento}
                      onChange={(v) => setForm({ ...form, data_nascimento: v })}
                      placeholder="dd/mm/aaaa"
                    />
                  </FormField>
                  <FormField label="Género" width="md">
                    <FormRadixSelect
                      value={form.genero}
                      onChange={(v) => setForm({ ...form, genero: v })}
                      options={[
                        { value: 'Feminino', label: 'Feminino' },
                        { value: 'Masculino', label: 'Masculino' },
                      ]}
                    />
                  </FormField>
                  <FormField label="NIF" width="md">
                    <FormInput
                      className="font-mono tabular-nums"
                      value={form.nif}
                      onChange={(e) => setForm({ ...form, nif: e.target.value })}
                      placeholder="000000000"
                    />
                  </FormField>
                  <FormField label="Telemóvel" required width="lg">
                    <FormInput
                      value={form.telemovel}
                      onChange={(e) => setForm({ ...form, telemovel: e.target.value })}
                      placeholder="+351 900 000 000"
                    />
                  </FormField>
                  <FormField label="Email" width="xl">
                    <FormInput
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </FormField>
                  <FormField label="Altura (cm)" width="xs">
                    <FormNumberInput
                      value={form.altura}
                      onChange={(e) => setForm({ ...form, altura: e.target.value.replace(/[^\d.,]/g, '') })}
                      placeholder="165"
                    />
                  </FormField>
                  <FormField label="Peso (kg)" width="xs">
                    <FormNumberInput
                      value={form.peso}
                      onChange={(e) => setForm({ ...form, peso: e.target.value.replace(/[^\d.,]/g, '') })}
                      placeholder="65"
                    />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Morada" icon={MapPin}>
                <div className={FORM.fieldRow}>
                  <FormField label="Morada" width="3xl">
                    <FormInput
                      value={form.morada}
                      onChange={(e) => setForm({ ...form, morada: e.target.value })}
                      placeholder="Rua, número, andar"
                    />
                  </FormField>
                  <FormField label="Código postal" width="sm">
                    <FormInput
                      className="font-mono tabular-nums"
                      value={form.codigo_postal}
                      onChange={(e) => handleCodigoPostalChange(e.target.value)}
                      onBlur={(e) => void autofillFromCp(e.target.value)}
                      placeholder="0000-000"
                    />
                  </FormField>
                  <FormField label="Cidade" width="lg">
                    <FormInput
                      value={form.cidade}
                      onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                      placeholder="Cidade"
                    />
                  </FormField>
                  <FormField label="Distrito" width="lg">
                    <FormInput
                      value={form.distrito}
                      onChange={(e) => setForm({ ...form, distrito: e.target.value })}
                      placeholder="Distrito"
                    />
                  </FormField>
                  <FormField label="País" width="md">
                    <FormInput
                      value={form.pais}
                      onChange={(e) => setForm({ ...form, pais: e.target.value })}
                      placeholder="Portugal"
                    />
                  </FormField>
                </div>
                <p className={`${FORM.hint} mt-3`}>
                  Distrito e cidade podem ser preenchidos automaticamente a partir do código postal.
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
                          Este contacto tem um processo activo. Cancele o processo em Processos para anular aqui ou use os motivos de processo.
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
                              Sem motivos configurados. Adicione em Administração → Motivos de anulação.
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
              <DetailSection title="Acompanhamento clínico" icon={User}>
                <div className={FORM.fieldRow}>
                  <FormField label="Médico" width="lg">
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
                        placeholder="Selecione o médico…"
                        options={medicos.filter((m) => m.ativo !== false).map((m) => ({
                          value: m.utilizador_id,
                          label: m.nome,
                        }))}
                      />
                    )}
                  </FormField>
                  <FormField
                    label="Onde é seguida"
                    width="3xl"
                    hint={gravidez.medico_id && entidadesDoMedico.length === 0
                      ? 'Este médico não tem entidades associadas. Configure em Administração → Médicos.'
                      : undefined}
                  >
                    <FormRadixSelect
                      value={gravidez.entidade_id}
                      onChange={(v) => setGravidez({ ...gravidez, entidade_id: v })}
                      disabled={!gravidez.medico_id}
                      placeholder={
                        gravidez.medico_id ? 'Selecione a entidade…' : 'Selecione primeiro o médico…'
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

              <DetailSection title="Teste e pacote" icon={Package}>
                <div className={FORM.fieldRow}>
                  <FormField label="Teste" width="lg">
                    <FormRadixSelect
                      value={gravidez.teste_pai_id}
                      onChange={(v) => setGravidez({ ...gravidez, teste_pai_id: v, teste_id: '' })}
                      placeholder="Selecione o teste…"
                      options={testesComSubTestes.map((t) => ({ value: t.id, label: t.nome }))}
                    />
                  </FormField>
                  <FormField
                    label={t('pages.contacts.form.pack')}
                    width="lg"
                    hint={t('pages.contacts.form.packHint')}
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
                  <FormField label="Tipo de gravidez" width="md">
                    <FormRadixSelect
                      value={gravidez.tipo_gravidez}
                      onChange={(v) => setGravidez({ ...gravidez, tipo_gravidez: v })}
                      options={[
                        { value: 'Singular', label: 'Singular' },
                        { value: 'Gemelar', label: 'Gemelar' },
                      ]}
                    />
                  </FormField>
                </div>
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Gestação" icon={Baby}>
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
                  O médico e o teste são usados uma única vez: ao associar o kit na colheita, o contacto passa a processo e deixa de aparecer em Contactos.
                </FormSectionNote>
              </div>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'colheita' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Agendamento" icon={Syringe}>
                <div className={FORM.fieldRow}>
                  <FormField
                    label="Posto de colheita"
                    required
                    width="3xl"
                    hint={
                      !contactoTemMoradaParaColheita
                        ? 'Indique a morada e o código postal no separador Identificação para ver postos próximos.'
                        : contactoTemMoradaParaColheita && postosProximos.length === 0
                          ? 'Não existem postos próximos desta morada. Configure postos em Administração → Laboratórios.'
                          : 'Postos do mesmo distrito, cidade ou código postal próximo — do mais perto ao mais longe.'
                    }
                  >
                    <FormRadixSelect
                      value={colheita.posto_id}
                      onChange={(v) => setColheita({ ...colheita, posto_id: v })}
                      disabled={!contactoTemMoradaParaColheita}
                      placeholder={
                        !form.morada?.trim()
                          ? 'Preencha primeiro a morada…'
                          : !hasValidContactPostalCode(form.codigo_postal)
                            ? 'Preencha primeiro o código postal…'
                            : 'Selecione o posto…'
                      }
                      options={postosProximos.map(({ posto, motivo }) => ({
                        value: posto.id,
                        label: [
                          posto.nome,
                          posto.cidade ? ` — ${posto.cidade}` : '',
                          posto.codigo_postal ? ` (${posto.codigo_postal})` : '',
                          ` · ${formatPostoProximidadeMotivo(motivo)}`,
                        ].join(''),
                      }))}
                    />
                  </FormField>
                  <FormField label="Data prevista da colheita" required width="sm">
                    <FormDatePicker
                      value={colheita.data_prevista}
                      onChange={(v) => setColheita({ ...colheita, data_prevista: v })}
                      allowAnyDate={false}
                      allowExistingPastDate
                      placeholder="dd/mm/aaaa"
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
                        <span>A verificar stock do posto…</span>
                      </FormInlineAlert>
                    ) : stockInfo && stockInfo.disponiveis > 0 ? (
                      <FormInlineAlert tone="success">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{stockInfo.disponiveis} kit(s) {kitStockLabel} disponível(eis) neste posto.</span>
                      </FormInlineAlert>
                    ) : (
                      <FormInlineAlert tone="warning">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>
                          Atenção: o posto {postos.find((p) => p.id === colheita.posto_id)?.nome || ''} não possui kits {kitStockLabel} para a data selecionada. O registo não é bloqueado.
                        </span>
                      </FormInlineAlert>
                    )}
                  </div>
                )}
              </DetailSection>

              <DetailDivider />

              <DetailSection title="Colheita efectiva" icon={Package}>
                <div className={FORM.fieldRow}>
                  <FormField
                    label="Data efectiva da colheita"
                    width="sm"
                    hint="Ao preencher, será pedida a seleção de um kit disponível do posto."
                  >
                    <FormDatePicker
                      value={colheita.data_efetiva}
                      disabled={!!linked}
                      onChange={(v) => void handleDataEfetiva(v)}
                      allowAnyDate={false}
                      allowExistingPastDate
                      placeholder="dd/mm/aaaa"
                    />
                  </FormField>
                  {linked && (
                    <div className="w-full max-w-xl pt-6">
                      <FormInlineAlert tone="success">
                        <Package className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Kit {linked.kit} associado · Processo {linked.processo} criado.</span>
                      </FormInlineAlert>
                    </div>
                  )}
                </div>
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'faturacao' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Faturação" icon={Receipt}>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                  Emita a fatura ao criar o contacto. Os dados são transferidos para o processo após a colheita.
                </p>
                <ProcessFaturacaoFields
                  value={contactFaturacao}
                  onChange={setContactFaturacao}
                  canUpdate={canEditFaturacao}
                />
              </DetailSection>
            </DetailPanel>
          </FormTabContent>
        )}

        {tab === 'notas' && (
          <FormTabContent>
            <DetailPanel>
              <DetailSection title="Notas internas" icon={StickyNote}>
                <FormField
                  label="Observações"
                  width="3xl"
                  hint="Notas internas do contacto — copiadas para o processo na colheita."
                >
                  <FormTextarea
                    rows={6}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Registe aqui informação relevante para a equipa…"
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
                addAnexo={addAnexo}
                deleteAnexo={deleteAnexo}
              />
            ) : (
              <DetailPanel>
                <DetailSection title="Anexos" icon={Paperclip}>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Guarde o contacto primeiro para poder adicionar anexos.</p>
                </DetailSection>
              </DetailPanel>
            )}
          </FormTabContent>
        )}
      </FormPageBody>

      {/* Modal de seleção de kit */}
      {kitModal.open && (
        <AppModal title="Selecionar kit disponível" onClose={() => { setKitModal({ open: false, loading: false, kits: [] }); setLabPreview(null); }}>
          {labPreview && (
            <ModalAlert>
              Laboratório final previsto: <strong>{labPreview.nome}</strong>
              {labPreview.codigo ? ` (${labPreview.codigo})` : ''}
            </ModalAlert>
          )}
          {kitModal.loading ? (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 py-6 justify-center text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> A carregar kits…
            </div>
          ) : kitModal.kits.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="w-8 h-8 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Sem kits {kitStockLabel} disponíveis neste posto.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {kitModal.kits.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => void handleSelecionarKit(k)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-teal-300 dark:hover:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors text-left"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono">{k.codigo_barras}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {k.teste_nome || k.tipo_kit || 'Kit'}{k.data_validade ? ` · validade ${new Date(k.data_validade).toLocaleDateString('pt-PT')}` : ''}
                    </div>
                  </div>
                  <Package className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                </button>
              ))}
            </div>
          )}
        </AppModal>
      )}
    </FormPageShell>
  );
}
