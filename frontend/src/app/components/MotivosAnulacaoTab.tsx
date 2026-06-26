import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ADD_ACTION_BUTTON_CLASS, FORM_INPUT_CLASS } from '../../lib/design-system';
import { motivosAnulacaoApi } from '../../lib/api-motivos-anulacao';
import type { MotivoAnulacao } from '../data/types';
import { MOTIVO_CONTEXTO_LABEL } from '../../lib/motivos-anulacao';
import type { MotivoAnulacaoContexto } from '../../lib/motivos-anulacao';
import {
  ADMIN_ACTION_BTN_CLASS,
  ADMIN_DELETE_BTN_CLASS,
  ADMIN_TABLE_BODY_CLASS,
  ADMIN_TABLE_HEAD_CLASS,
  ADMIN_TABLE_ROW_CLASS,
  AdminRowActions,
  AdminTabPanel,
  AdminTabToolbar,
  AdminTableHeadCell,
} from './definicoes/admin-tab-ui';

const inputClass = FORM_INPUT_CLASS;
const labelClass = 'block mb-1.5 text-gray-600 dark:text-gray-400';

export function MotivosAnulacaoTab({ canCreate, canUpdate, canDelete }: { canCreate: boolean; canUpdate: boolean; canDelete: boolean }) {
  const [motivos, setMotivos] = useState<MotivoAnulacao[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<MotivoAnulacao | null>(null);
  const [form, setForm] = useState<{ nome: string; contexto: MotivoAnulacaoContexto; reabre_contacto: boolean }>({
    nome: '',
    contexto: 'contacto',
    reabre_contacto: false,
  });

  const load = useCallback(async () => {
    try {
      setMotivos(await motivosAnulacaoApi.list());
    } catch {
      setMotivos([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = motivos.filter((m) => m.nome.toLowerCase().includes(search.toLowerCase()));
  const openNew = () => {
    setEditItem(null);
    setForm({ nome: '', contexto: 'contacto', reabre_contacto: false });
    setIsOpen(true);
  };
  const openEdit = (m: MotivoAnulacao) => {
    setEditItem(m);
    setForm({
      nome: m.nome,
      contexto: m.contexto || 'contacto',
      reabre_contacto: !!m.reabre_contacto,
    });
    setIsOpen(true);
  };

  const handleSave = async (ev: FormEvent) => {
    ev.preventDefault();
    try {
      if (editItem) {
        await motivosAnulacaoApi.update(editItem.id, form);
        toast.success('Motivo de anulação atualizado!');
      } else {
        await motivosAnulacaoApi.create(form);
        toast.success('Motivo de anulação criado!');
      }
      setIsOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao guardar motivo de anulação.');
    }
  };

  const handleDelete = (id: string, nome: string) => {
    if (!confirm(`Eliminar motivo "${nome}"?`)) return;
    void motivosAnulacaoApi.remove(id)
      .then(async () => {
        toast.success('Motivo de anulação eliminado.');
        await load();
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Falha ao eliminar motivo de anulação.'));
  };

  return (
    <div className="space-y-4">
      <AdminTabToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="Pesquisar motivos..."
        searchName="search-motivos-anulacao"
        action={canCreate ? (
          <button type="button" onClick={openNew} className={ADD_ACTION_BUTTON_CLASS}>
            <Plus className="w-4 h-4" /> Inserir novo
          </button>
        ) : undefined}
      />
      <AdminTabPanel>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={ADMIN_TABLE_HEAD_CLASS}>
              <tr>
                {['Nome', 'Aplicável a', 'Ações'].map((h) => (
                  <AdminTableHeadCell key={h} align={h === 'Ações' ? 'right' : 'left'}>
                    {h}
                  </AdminTableHeadCell>
                ))}
              </tr>
            </thead>
            <tbody className={ADMIN_TABLE_BODY_CLASS}>
              {filtered.map((m) => (
                <tr key={m.id} className={ADMIN_TABLE_ROW_CLASS}>
                  <td className="px-4 py-3 text-[13px] font-medium text-slate-800 dark:text-slate-100">{m.nome}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-500 dark:text-slate-400">
                    {MOTIVO_CONTEXTO_LABEL[m.contexto || 'contacto']}
                    {m.contexto === 'processo' && m.reabre_contacto ? ' · repete colheita' : ''}
                    {m.contexto === 'processo' && !m.reabre_contacto ? ' · cancela processo errado' : ''}
                  </td>
                  <td className="px-4 py-3">
                    <AdminRowActions>
                      {canUpdate && (
                        <button type="button" onClick={() => openEdit(m)} className={ADMIN_ACTION_BTN_CLASS} title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (
                        <button type="button" onClick={() => handleDelete(m.id, m.nome)} className={ADMIN_DELETE_BTN_CLASS} title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </AdminRowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTabPanel>
      {(canCreate || canUpdate) && isOpen && (
        <Modal title={editItem ? 'Editar motivo de anulação' : 'Novo motivo de anulação'} onClose={() => setIsOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Aplicável a" required>
              <select
                value={form.contexto}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  contexto: e.target.value as MotivoAnulacaoContexto,
                  reabre_contacto: e.target.value === 'processo' ? f.reabre_contacto : false,
                }))}
                className={inputClass}
                style={{ fontSize: '14px' }}
              >
                <option value="contacto">{MOTIVO_CONTEXTO_LABEL.contacto}</option>
                <option value="processo">{MOTIVO_CONTEXTO_LABEL.processo}</option>
              </select>
            </Field>
            {form.contexto === 'processo' && (
              <div className="space-y-2">
                <label className="flex items-start gap-2 text-gray-700 dark:text-gray-300" style={{ fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.reabre_contacto}
                    onChange={(e) => setForm((f) => ({ ...f, reabre_contacto: e.target.checked }))}
                  />
                  <span>
                    Repetição de colheita — repõe contacto só com identificação
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Use para casos clínicos (ex.: fração fetal insuficiente). Se desmarcado, o motivo serve
                      apenas para cancelar um processo errado (ex.: kit ou nº de processo incorrecto), mantendo
                      os dados clínicos do contacto.
                    </span>
                  </span>
                </label>
              </div>
            )}
            <Field label="Nome" required>
              <input
                required
                type="text"
                name="motivo-anulacao-nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className={inputClass}
                placeholder="Desistência"
                style={{ fontSize: '14px' }}
              />
            </Field>
            <ModalFooter onClose={() => setIsOpen(false)} isEdit={!!editItem} />
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-gray-900 dark:text-gray-100" style={{ fontSize: '17px', fontWeight: 600 }}>{title}</h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className={labelClass} style={{ fontSize: '13px' }}>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
    </div>
  );
}

function ModalFooter({ onClose, isEdit }: { onClose: () => void; isEdit: boolean }) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors" style={{ fontSize: '14px' }}>Cancelar</button>
      <button type="submit" className="px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 shadow-sm transition-colors" style={{ fontSize: '14px', fontWeight: 500 }}>{isEdit ? 'Guardar' : 'Criar'}</button>
    </div>
  );
}
