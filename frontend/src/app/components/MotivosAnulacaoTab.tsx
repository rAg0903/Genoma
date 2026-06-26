import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ADD_ACTION_BUTTON_CLASS } from '../../lib/design-system';
import { FORM } from '../../lib/design-tokens';
import { motivosAnulacaoApi } from '../../lib/api-motivos-anulacao';
import type { MotivoAnulacao } from '../data/types';
import { MOTIVO_CONTEXTO_LABEL } from '../../lib/motivos-anulacao';
import type { MotivoAnulacaoContexto } from '../../lib/motivos-anulacao';
import { AppModal, ModalActions, ModalCheckbox, ModalField, MODAL_INPUT_CLASS } from './shared/AppModal';
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
        <AppModal
          title={editItem ? 'Editar motivo de anulação' : 'Novo motivo de anulação'}
          onClose={() => setIsOpen(false)}
          footer={<ModalActions onCancel={() => setIsOpen(false)} isEdit={!!editItem} formId="motivo-form" />}
        >
          <form id="motivo-form" onSubmit={handleSave} className={FORM.stack}>
            <ModalField label="Aplicável a" required>
              <select
                value={form.contexto}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  contexto: e.target.value as MotivoAnulacaoContexto,
                  reabre_contacto: e.target.value === 'processo' ? f.reabre_contacto : false,
                }))}
                className={MODAL_INPUT_CLASS}
              >
                <option value="contacto">{MOTIVO_CONTEXTO_LABEL.contacto}</option>
                <option value="processo">{MOTIVO_CONTEXTO_LABEL.processo}</option>
              </select>
            </ModalField>
            {form.contexto === 'processo' && (
              <ModalCheckbox
                checked={form.reabre_contacto}
                onChange={(reabre_contacto) => setForm((f) => ({ ...f, reabre_contacto }))}
                label={(
                  <>
                    Repetição de colheita — repõe contacto só com identificação
                    <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Use para casos clínicos (ex.: fração fetal insuficiente). Se desmarcado, o motivo serve
                      apenas para cancelar um processo errado (ex.: kit ou nº de processo incorrecto), mantendo
                      os dados clínicos do contacto.
                    </span>
                  </>
                )}
              />
            )}
            <ModalField label="Nome" required>
              <input
                required
                type="text"
                name="motivo-anulacao-nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className={MODAL_INPUT_CLASS}
                placeholder="Desistência"
              />
            </ModalField>
          </form>
        </AppModal>
      )}
    </div>
  );
}
