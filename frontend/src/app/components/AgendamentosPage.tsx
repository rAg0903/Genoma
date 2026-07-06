import { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2, CheckCircle2, MapPin, CalendarClock, Clock } from 'lucide-react';
import { agendamentosApi, Agendamento, CalendarDay } from '../../lib/api-agendamentos';
import { AgendaCalendar } from './agendamentos/AgendaCalendar';
import { PageHeader } from './shared/PageHeader';
import { EmptyState } from './shared/EmptyState';
import { StatusBadge } from './shared/StatusBadge';
import { PROCESS_STATUS_STYLES } from '../../lib/design-system';
import { CONTROL, PAGE, PANEL, SURFACE } from '../../lib/design-tokens';
import { formatCalendarDatePt } from '../../lib/dates';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { useConfirmAction } from '../context/ConfirmActionContext';
import { notifyError, notifySuccess } from '../../lib/toast';

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function AgendamentosPage() {
  const { hasPermission } = useAuth();
  const { postos } = useData();
  const { t } = useLanguage();
  const confirmAction = useConfirmAction();

  const canDelete = hasPermission('contactos', 'delete');

  const today = iso(new Date());
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [postoFilter, setPostoFilter] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const loadCalendar = useCallback(async () => {
    setLoadingCal(true);
    try {
      const year = month.getFullYear();
      const m = month.getMonth();
      const from = iso(new Date(year, m, 1));
      const to = iso(new Date(year, m + 1, 0));
      const days = await agendamentosApi.getCalendario(from, to);
      setCalendarDays(days);
    } catch {
      notifyError(null, t('common.operationFailed'));
    } finally {
      setLoadingCal(false);
    }
  }, [month, t]);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const list = await agendamentosApi.list({ from: selectedDate, to: selectedDate, posto_id: postoFilter || undefined });
      setAgendamentos(list);
    } catch {
      notifyError(null, t('common.operationFailed'));
    } finally {
      setLoadingList(false);
    }
  }, [selectedDate, postoFilter, t]);

  useEffect(() => { void loadCalendar(); }, [loadCalendar]);
  useEffect(() => { void loadList(); }, [loadList]);

  const handlePrevMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const handleNextMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const handleRegistar = async (ag: Agendamento) => {
    setBusy(ag.id);
    try {
      await agendamentosApi.registar(ag.id, { data_efetiva: today });
      notifySuccess(t('ux.colheitasHoje.registar'));
      void loadList();
    } catch (e) {
      notifyError(e, t('common.operationFailed'));
    } finally {
      setBusy(null);
    }
  };

  const handleCancelar = async (ag: Agendamento) => {
    if (!(await confirmAction({
      title: t('ux.confirmAction.cancelAgendamentoTitle'),
      message: t('ux.confirmAction.cancelAgendamentoMessage', { nome: ag.paciente_nome }),
      variant: 'danger',
    }))) return;
    setBusy(ag.id);
    try {
      await agendamentosApi.cancel(ag.id);
      notifySuccess(t('ux.confirmAction.cancelAgendamentoTitle'));
      void loadCalendar();
      void loadList();
    } catch (e) {
      notifyError(e, t('common.operationFailed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={PAGE.shell}>
      <div className={PAGE.body}>
        <PageHeader
          title="Agendamentos"
          subtitle="Colheitas agendadas por data e posto"
        />

        <div className="flex flex-col lg:flex-row gap-5">
          {/* Painel esquerdo: calendário + filtro */}
          <div className="lg:w-80 xl:w-88 flex-shrink-0">
            {loadingCal ? (
              <div className={`${SURFACE.cardElevated} flex items-center justify-center py-20`}>
                <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
              </div>
            ) : (
              <AgendaCalendar
                month={month}
                days={calendarDays}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                postos={postos}
                postoFilter={postoFilter}
                onPostoChange={setPostoFilter}
              />
            )}
          </div>

          {/* Painel direito: agendamentos do dia selecionado */}
          <div className="flex-1 min-w-0">
            <div className={PANEL.table}>
              <header className={`${PANEL.tableHead} px-4 py-3 flex items-center gap-2`}>
                <CalendarClock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatCalendarDatePt(selectedDate)}
                </h3>
                <span className="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400">
                  {agendamentos.length} agendamento(s)
                </span>
              </header>

              {loadingList ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />A carregar…
                </div>
              ) : agendamentos.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Sem agendamentos"
                  description={`Sem colheitas agendadas para ${formatCalendarDatePt(selectedDate)}. Crie um agendamento a partir da ficha do contacto.`}
                />
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {agendamentos.map((ag) => (
                    <li key={ag.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{ag.paciente_nome}</span>
                          <StatusBadge status={ag.processo_status} map={PROCESS_STATUS_STYLES} className="text-[11px] px-1.5 py-0.5" />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {ag.posto_nome && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ag.posto_nome}</span>
                          )}
                          {ag.periodo && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ag.periodo}</span>
                          )}
                          {ag.kit_codigo && (
                            <span className="font-mono text-teal-600 dark:text-teal-400">Kit: {ag.kit_codigo}</span>
                          )}
                          {ag.numero_processo && (
                            <span className="font-mono text-slate-500">#{ag.numero_processo}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {ag.processo_status === 'Kit Reservado' && (
                          <button
                            type="button"
                            title="Registar colheita efectuada"
                            disabled={busy === ag.id}
                            onClick={() => void handleRegistar(ag)}
                            className={`${CONTROL.buttonGhost} p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-50`}
                          >
                            {busy === ag.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            title="Cancelar agendamento"
                            disabled={busy === ag.id}
                            onClick={() => void handleCancelar(ag)}
                            className={`${CONTROL.buttonGhost} p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 disabled:opacity-50`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

