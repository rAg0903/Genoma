import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Contact, Processo } from '../../data/types';
import { useData } from '../../context/DataContext';
import { apiRequest } from '../../../lib/api';
import { getAuthToken, processosApi } from '../../../lib/api-processos';
import { ApiPaciente, mapApiPacienteToContact } from '../../../lib/pacientes';
import {
  ColheitaFormState,
  colheitaProcessoToForm,
  emptyColheitaForm,
} from '../../../lib/colheita';
import {
  ProcessFormData,
  buildProcessSubmitPayload,
  processToFormData,
  validateProcessForm,
} from '../../../lib/process-form';
import { filterMotivosPorContexto, getMotivoProcessoCancelHint } from '../../../lib/motivos-anulacao';

export function useProcessRecordEdit(processo: Processo | undefined, canUpdate: boolean, t: (key: string) => string) {
  const { contacts, processos, updateProcesso, refreshProcessos, motivosAnulacao } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<ProcessFormData | null>(null);
  const [paciente, setPaciente] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);
  const [anulacao, setAnulacao] = useState({ cancelado: false, motivo_anulacao_id: '' });
  const [colheita, setColheita] = useState<ColheitaFormState>(emptyColheitaForm());
  const [colheitaLoaded, setColheitaLoaded] = useState(false);

  const jaCancelado = processo?.estado === 'Cancelado';
  const motivosProcesso = useMemo(
    () => filterMotivosPorContexto(motivosAnulacao, 'processo'),
    [motivosAnulacao],
  );
  const motivoSelecionado = motivosProcesso.find((m) => m.id === anulacao.motivo_anulacao_id);
  const motivoCanceladoNome = processo?.motivo_anulacao_nome
    || motivosProcesso.find((m) => m.id === processo?.motivo_anulacao_id)?.nome
    || '';

  const resetFromProcesso = useCallback((p: Processo) => {
    setForm(processToFormData(p));
    setAnulacao({
      cancelado: p.estado === 'Cancelado',
      motivo_anulacao_id: p.motivo_anulacao_id || '',
    });
  }, []);

  useEffect(() => {
    if (processo) resetFromProcesso(processo);
  }, [processo, resetFromProcesso]);

  useEffect(() => {
    if (!form?.paciente_id) {
      setPaciente(null);
      return;
    }
    const cached = contacts.find((c) => c.id === form.paciente_id);
    if (cached) {
      setPaciente(cached);
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    apiRequest<{ data: ApiPaciente }>(`/pacientes/${form.paciente_id}`, { token })
      .then((r) => { if (r?.data) setPaciente(mapApiPacienteToContact(r.data)); })
      .catch(() => setPaciente(null));
  }, [form?.paciente_id, contacts]);

  useEffect(() => {
    if (!processo?.id) {
      setColheita(emptyColheitaForm());
      setColheitaLoaded(false);
      return;
    }
    let cancelled = false;
    processosApi.getColheita(processo.id)
      .then((row) => {
        if (cancelled) return;
        setColheita(colheitaProcessoToForm(row));
        setColheitaLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setColheita(emptyColheitaForm());
        setColheitaLoaded(true);
      });
    return () => { cancelled = true; };
  }, [processo?.id]);

  const startEdit = useCallback(() => {
    if (!processo || !canUpdate) return;
    resetFromProcesso(processo);
    setIsEditing(true);
  }, [canUpdate, processo, resetFromProcesso]);

  const cancelEdit = useCallback(() => {
    if (processo) resetFromProcesso(processo);
    setIsEditing(false);
  }, [processo, resetFromProcesso]);

  const save = useCallback(async () => {
    if (!processo || !form || !canUpdate) return;
    if (anulacao.cancelado && !anulacao.motivo_anulacao_id) {
      toast.error(t('pages.processes.form.cancelReasonRequired'));
      return false;
    }
    const formComEstado = {
      ...form,
      estado: anulacao.cancelado ? 'Cancelado' as const : form.estado,
      motivo_anulacao_id: anulacao.cancelado ? anulacao.motivo_anulacao_id : null,
    };
    const error = validateProcessForm(formComEstado, processos, processo.id);
    if (error) {
      toast.error(error);
      return false;
    }
    setSaving(true);
    try {
      const payload = buildProcessSubmitPayload(formComEstado);
      if (formComEstado.estado === processo.estado) {
        delete payload.estado;
      }
      await updateProcesso(processo.id, payload);
      if (colheitaLoaded) {
        await processosApi.updateColheita(processo.id, {
          data_prevista: colheita.data_prevista || null,
          data_efetiva: colheita.data_efetiva || null,
          periodo: colheita.periodo || null,
          facturado_entidade: colheita.facturado_entidade,
          repeticao: colheita.repeticao,
          nao_notificar: colheita.nao_notificar,
          semanas_gestacao_colheita: colheita.semanas_gestacao !== '' ? Number(colheita.semanas_gestacao) : null,
          dias_gestacao_colheita: colheita.dias_gestacao !== '' ? Number(colheita.dias_gestacao) : null,
          data_recepcao_amostra: colheita.data_recepcao_amostra || null,
        });
      }
      toast.success(anulacao.cancelado ? 'Processo cancelado.' : 'Processo atualizado!');
      setIsEditing(false);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao guardar processo.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [anulacao, canUpdate, colheita, colheitaLoaded, form, processo, processos, t, updateProcesso]);

  return {
    isEditing,
    setIsEditing,
    form,
    setForm,
    paciente,
    saving,
    anulacao,
    setAnulacao,
    jaCancelado,
    motivosProcesso,
    motivoSelecionado,
    motivoCanceladoNome,
    colheita,
    setColheita,
    colheitaLoaded,
    startEdit,
    cancelEdit,
    save,
    refreshProcessos,
  };
}

export type ProcessRecordEdit = ReturnType<typeof useProcessRecordEdit>;
