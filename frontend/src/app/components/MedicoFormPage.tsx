import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Save, User, Phone, MapPin, StickyNote, FileText, Receipt, Loader2, Plus, Trash2, ChevronRight, FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Section } from './ContactDetail';
import {
  MedicoCondicaoTesteInput,
  MedicoContactoSecundario,
  MedicoPayload,
  getMedicoSaveFeedback,
  medicosApi,
} from '../../lib/api-medicos';
import { Teste } from '../data/types';

type TabId = 'identificacao' | 'condicoes' | 'relatorios' | 'notas';

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: 'identificacao', label: 'Identificação', icon: User },
  { id: 'condicoes', label: 'Condições comerciais', icon: Receipt },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
  { id: 'notas', label: 'Notas', icon: StickyNote },
];

const inputClass = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500';
const labelClass = 'block mb-1.5 text-gray-600 dark:text-gray-400';

const emptyContacto = (): MedicoContactoSecundario => ({ nome: '', funcao: '', email: '', telefone: '' });

const emptyForm = (): MedicoPayload => ({
  nome: '',
  titulo: '',
  genero: 'Feminino',
  pais: 'Portugal',
  num_ordem: '',
  telefone_fixo: '',
  telefone_movel: '',
  email: '',
  criterio_busca_postos: 'nome',
  notas: '',
  ativo: true,
  especialidade: null,
  contactos_secundarios: [emptyContacto(), emptyContacto(), emptyContacto()],
  locais_trabalho: [],
  condicoes_testes: [],
});

const mergeCondicoesComCatalogo = (testes: Teste[], atuais: MedicoCondicaoTesteInput[]) => {
  const byId = new Map(atuais.map((c) => [c.teste_id, c]));
  return testes.map((t) => ({
    teste_id: t.id,
    comissao: byId.get(t.id)?.comissao ?? '',
    prazo_pagamento_dias: byId.get(t.id)?.prazo_pagamento_dias ?? '',
  }));
};

export function MedicoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { entidades, testes, refreshEntidades } = useData();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('definicoes', 'create');
  const canUpdate = hasPermission('definicoes', 'update');

  const editing = Boolean(id);
  const [tab, setTab] = useState<TabId>('identificacao');
  const [form, setForm] = useState<MedicoPayload>(emptyForm);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);

  const entidadesAtivas = useMemo(() => entidades.filter((e) => e.ativo !== false), [entidades]);
  const testesAtivos = useMemo(
    () => [...testes.filter((t) => t.ativo !== false)].sort((a, b) => a.nome.localeCompare(b.nome, 'pt')),
    [testes],
  );
  const testesPorId = useMemo(() => new Map(testesAtivos.map((t) => [t.id, t])), [testesAtivos]);

  useEffect(() => {
    void refreshEntidades();
  }, [refreshEntidades]);

  useEffect(() => {
    if (testesAtivos.length === 0) return;
    setForm((prev) => ({
      ...prev,
      condicoes_testes: mergeCondicoesComCatalogo(testesAtivos, prev.condicoes_testes),
    }));
  }, [testesAtivos]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    medicosApi.get(id)
      .then((m) => {
        if (!m) return;
        const contactos = [...(m.contactos_secundarios || [])];
        while (contactos.length < 3) contactos.push(emptyContacto());
        setForm({
          nome: m.nome,
          titulo: m.titulo || '',
          genero: m.genero || 'Feminino',
          pais: m.pais || 'Portugal',
          num_ordem: m.num_ordem || '',
          telefone_fixo: m.telefone_fixo || '',
          telefone_movel: m.telefone_movel || '',
          email: m.email,
          criterio_busca_postos: m.criterio_busca_postos || 'nome',
          notas: m.notas || '',
          ativo: m.ativo !== false,
          especialidade: m.especialidade,
          contactos_secundarios: contactos.slice(0, 3),
          locais_trabalho: (m.locais_trabalho || []).map((l) => ({ entidade_id: l.entidade_id })),
          condicoes_testes: (m.condicoes_testes || []).map((c) => ({
            teste_id: c.teste_id,
            comissao: c.comissao != null ? String(c.comissao) : '',
            prazo_pagamento_dias: c.prazo_pagamento_dias != null ? String(c.prazo_pagamento_dias) : '',
          })),
        });
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Não foi possível carregar o médico.');
        navigate('/definicoes?tab=medicos');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const displayName = [form.titulo, form.nome].filter(Boolean).join(' ').trim();
  const initials = (displayName || 'Novo Médico').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const podeGuardar = editing ? canUpdate : canCreate;

  const updateContacto = (index: number, patch: Partial<MedicoContactoSecundario>) => {
    setForm((prev) => {
      const next = [...prev.contactos_secundarios];
      next[index] = { ...next[index], ...patch };
      return { ...prev, contactos_secundarios: next };
    });
  };

  const addLocal = () => {
    const used = new Set(form.locais_trabalho.map((l) => l.entidade_id));
    const nextEntidade = entidadesAtivas.find((e) => !used.has(e.id));
    if (!nextEntidade) {
      toast.message('Todas as entidades disponíveis já foram adicionadas.');
      return;
    }
    setForm((prev) => ({
      ...prev,
      locais_trabalho: [...prev.locais_trabalho, { entidade_id: nextEntidade.id }],
    }));
  };

  const updateLocal = (index: number, entidadeId: string) => {
    setForm((prev) => {
      const next = [...prev.locais_trabalho];
      next[index] = { entidade_id: entidadeId };
      return { ...prev, locais_trabalho: next };
    });
  };

  const updateCondicao = (testeId: string, patch: Partial<MedicoCondicaoTesteInput>) => {
    setForm((prev) => ({
      ...prev,
      condicoes_testes: prev.condicoes_testes.map((c) => (
        c.teste_id === testeId ? { ...c, ...patch } : c
      )),
    }));
  };

  const removeLocal = (index: number) => {
    setForm((prev) => ({
      ...prev,
      locais_trabalho: prev.locais_trabalho.filter((_, i) => i !== index),
    }));
  };

  const handleGuardar = async () => {
    if (!form.nome.trim()) { toast.error('Indique o nome do médico.'); return; }
    if (!form.email.trim()) { toast.error('Indique o email do médico.'); return; }

    setSaving(true);
    try {
      if (editing && id) {
        await medicosApi.update(id, form);
        toast.success('Médico atualizado.');
      } else {
        await medicosApi.create(form);
        toast.success('Médico criado.');
      }
      navigate('/definicoes?tab=medicos');
    } catch (err) {
      const feedback = getMedicoSaveFeedback(err);
      if (feedback.kind === 'warning') toast.warning(feedback.message);
      else toast.error(feedback.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[320px] text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> A carregar médico…
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-gray-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-4 md:py-5">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate('/definicoes?tab=medicos')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
              <span className="text-teal-700 dark:text-teal-400" style={{ fontSize: '15px', fontWeight: 700 }}>{initials}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-gray-900 dark:text-gray-100 truncate" style={{ fontSize: '18px', fontWeight: 600 }}>
                {displayName || (editing ? 'Editar médico' : 'Novo médico')}
              </h1>
              <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '12px', marginTop: 2 }}>
                {editing ? 'Edição de médico' : 'Criação de médico'}
              </p>
            </div>
          </div>
          {podeGuardar && (
            <button type="button" onClick={() => void handleGuardar()} disabled={saving} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-60 flex-shrink-0" style={{ fontSize: '13px', fontWeight: 500 }}>
              <Save className="w-4 h-4" /> <span className="hidden sm:inline">{saving ? 'A guardar…' : 'Guardar'}</span>
            </button>
          )}
        </div>

        <div className="flex gap-1 mt-4 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} type="button" onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${active ? 'bg-teal-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                style={{ fontSize: '13px', fontWeight: active ? 600 : 500 }}>
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {tab === 'identificacao' && (
          <div className="space-y-4 max-w-4xl">
            <Section title="Identificação" icon={User}>
              <div className="space-y-4">
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Nome <span className="text-red-500">*</span></label>
                  <input className={inputClass} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} style={{ fontSize: '14px' }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Título</label>
                    <input className={inputClass} value={form.titulo || ''} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Dr., Dra., Prof." style={{ fontSize: '14px' }} />
                  </div>
                  <div>
                    <label className={labelClass} style={{ fontSize: '13px' }}>Género</label>
                    <select className={inputClass} value={form.genero || 'Feminino'} onChange={(e) => setForm({ ...form, genero: e.target.value })} style={{ fontSize: '14px' }}>
                      <option value="Feminino">Feminino</option>
                      <option value="Masculino">Masculino</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Nº Cédula</label>
                  <input className={inputClass} value={form.num_ordem || ''} onChange={(e) => setForm({ ...form, num_ordem: e.target.value })} style={{ fontSize: '14px', fontFamily: 'monospace' }} />
                </div>
              </div>
            </Section>

            <Section title="Contactos" icon={Phone}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Telefone (fixo)</label>
                  <input className={inputClass} value={form.telefone_fixo || ''} onChange={(e) => setForm({ ...form, telefone_fixo: e.target.value })} style={{ fontSize: '14px' }} />
                </div>
                <div>
                  <label className={labelClass} style={{ fontSize: '13px' }}>Telefone (móvel)</label>
                  <input className={inputClass} value={form.telefone_movel || ''} onChange={(e) => setForm({ ...form, telefone_movel: e.target.value })} style={{ fontSize: '14px' }} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass} style={{ fontSize: '13px' }}>Email <span className="text-red-500">*</span></label>
                  <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ fontSize: '14px' }} />
                </div>
              </div>
            </Section>

            <Section title="Contactos secundários" icon={Phone}>
              <div className="space-y-4">
                {form.contactos_secundarios.map((c, index) => (
                  <div key={index} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contacto {index + 1}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass} style={{ fontSize: '12px' }}>Nome</label>
                        <input className={inputClass} value={c.nome} onChange={(e) => updateContacto(index, { nome: e.target.value })} style={{ fontSize: '14px' }} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ fontSize: '12px' }}>Função</label>
                        <input className={inputClass} value={c.funcao} onChange={(e) => updateContacto(index, { funcao: e.target.value })} style={{ fontSize: '14px' }} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ fontSize: '12px' }}>Email</label>
                        <input type="email" className={inputClass} value={c.email} onChange={(e) => updateContacto(index, { email: e.target.value })} style={{ fontSize: '14px' }} />
                      </div>
                      <div>
                        <label className={labelClass} style={{ fontSize: '12px' }}>Telefone</label>
                        <input className={inputClass} value={c.telefone} onChange={(e) => updateContacto(index, { telefone: e.target.value })} style={{ fontSize: '14px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Locais de trabalho" icon={MapPin}>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="grid grid-cols-[auto_1fr_auto] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <span />
                    <span>Entidade</span>
                    <span />
                  </div>
                  {form.locais_trabalho.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-400">Sem locais de trabalho. Adicione uma entidade.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {form.locais_trabalho.map((local, index) => (
                        <div key={`${local.entidade_id}-${index}`} className="grid grid-cols-[auto_1fr_auto] gap-2 items-center px-3 py-2.5">
                          <ChevronRight className="w-4 h-4 text-sky-500 shrink-0" />
                          <select
                            className={inputClass}
                            value={local.entidade_id}
                            onChange={(e) => updateLocal(index, e.target.value)}
                            style={{ fontSize: '14px' }}
                          >
                            {entidadesAtivas.map((e) => (
                              <option key={e.id} value={e.id}>{e.nome}{e.cidade ? ` — ${e.cidade}` : ''}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => removeLocal(index)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="button" onClick={addLocal} className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition">
                  <Plus className="w-4 h-4" /> Adicionar local de trabalho
                </button>
              </div>
            </Section>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.ativo !== false} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} className="w-4 h-4 accent-teal-600" />
              <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '13px' }}>Médico ativo</span>
            </label>
          </div>
        )}

        {tab === 'notas' && (
          <div className="max-w-3xl">
            <Section title="Notas" icon={StickyNote}>
              <textarea
                className={`${inputClass} min-h-[180px]`}
                value={form.notas || ''}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Notas internas sobre o médico…"
                style={{ fontSize: '14px' }}
              />
            </Section>
          </div>
        )}

        {tab === 'condicoes' && (
          <div className="max-w-4xl">
            <Section title="Testes" icon={FlaskConical}>
              {testesAtivos.length === 0 ? (
                <p className="text-sm text-slate-500">Não existem testes ativos na Administração.</p>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="grid grid-cols-[1fr_9rem_9rem] gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                    <span>Nome</span>
                    <span className="text-right">Comissão</span>
                    <span className="text-right">Prazo de pagamento</span>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[28rem] overflow-y-auto">
                    {form.condicoes_testes.map((c) => {
                      const teste = testesPorId.get(c.teste_id);
                      if (!teste) return null;
                      return (
                        <div key={c.teste_id} className="grid grid-cols-[1fr_9rem_9rem] gap-2 items-center px-3 py-2.5">
                          <span className="text-sm text-slate-800 dark:text-slate-100 pr-2">{teste.nome}</span>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className={`${inputClass} pr-7 text-right tabular-nums`}
                              value={c.comissao}
                              onChange={(e) => updateCondicao(c.teste_id, { comissao: e.target.value })}
                              placeholder="0"
                              style={{ fontSize: '13px' }}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">€</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              className={`${inputClass} pr-10 text-right tabular-nums`}
                              value={c.prazo_pagamento_dias}
                              onChange={(e) => updateCondicao(c.teste_id, { prazo_pagamento_dias: e.target.value })}
                              placeholder="0"
                              style={{ fontSize: '13px' }}
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">dias</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Section>
          </div>
        )}

        {tab === 'relatorios' && (
          <div className="max-w-3xl rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            Esta secção ficará disponível numa fase posterior.
          </div>
        )}
      </div>
    </div>
  );
}
