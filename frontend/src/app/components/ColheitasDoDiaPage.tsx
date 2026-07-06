import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2, Loader2, MapPin, CalendarClock, Clock } from 'lucide-react';
import { agendamentosApi, Agendamento } from '../../lib/api-agendamentos';
import { AgendaCalendar } from './agendamentos/AgendaCalendar';
import { PageHeader } from './shared/PageHeader';
import { EmptyState } from './shared/EmptyState';
import { StatusBadge } from './shared/StatusBadge';
import { ADD_ACTION_BUTTON_CLASS, PROCESS_STATUS_STYLES } from '../../lib/design-system';
import { PAGE, PANEL, SURFACE } from '../../lib/design-tokens';
import { formatCalendarDatePt } from '../../lib/dates';
import { useData } from '../context/DataContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { notifyError } from '../../lib/toast';

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function resolvePacienteId(ag: Agendamento): string | null {
  if (ag.paciente_id) return ag.paciente_id;
  if (ag.id.startsWith('pre-')) return ag.id.slice(4);
  return null;
}

const podeRegistarColheita = (ag: Agendamento) =>
  ag.processo_status === 'Kit Reservado' || ag.processo_status === 'Agendado';

export function ColheitasDoDiaPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { postos, processos } = useData();

  const today = todayIso();
  const [month, setMonth] = useState(() => new Date());
  const [calendarDays, setCalendarDays] = useState<{ dia: string; total: number; cor: 'cinza' | 'verde' | 'amarelo' | 'vermelho' }[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [postoFilter, setPostoFilter] = useState('');

  const loadCalendar = useCallback(async () => {
    setLoadingCal(true);
    try {
      const year = month.getFullYear();
      const m = month.getMonth();
      const from = `${year}-${String(m + 1).padStart(2, '0')}-01`;
      const to = `${year}-${String(m + 1).padStart(2, '0')}-${String(new Date(year, m + 1, 0).getDate()).padStart(2, '0')}`;
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
      const list = await agendamentosApi.list({
        from: today,
        to: today,
        posto_id: postoFilter || undefined,
      });
      setAgendamentos(list);
    } catch (e) {
      notifyError(e, t('common.operationFailed'));
    } finally {
      setLoadingList(false);
    }
  }, [postoFilter, t, today]);

  useEffect(() => { void loadCalendar(); }, [loadCalendar]);
  useEffect(() => { void loadList(); }, [loadList]);

  const handlePrevMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  const handleNextMonth = () => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));

  const goToColheitaContacto = (ag: Agendamento) => {
    const pacienteId = resolvePacienteId(ag)
      ?? processos.find((p) => p.id === ag.processo_id)?.paciente_id
      ?? null;

    if (pacienteId) {
      navigate(`/contactos/${pacienteId}/editar?tab=colheita`);
      return;
    }
    if (ag.processo_id) {
      navigate(`/processos/${ag.processo_id}`);
    }
  };

  const pendentes = useMemo(
    () => agendamentos.filter(podeRegistarColheita),
    [agendamentos],
  );

  return (
    <div className={PAGE.shell}>
      <div className={PAGE.body}>
        <PageHeader
          title={t('ux.colheitasHoje.title')}
          subtitle={t('ux.colheitasHoje.subtitle')}
        />

        <div className="flex flex-col lg:flex-row gap-5">
          <div className="lg:w-80 xl:w-88 flex-shrink-0">
            {loadingCal ? (
              <div className={`${SURFACE.cardElevated} flex items-center justify-center py-20`}>
                <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
              </div>
            ) : (
              <AgendaCalendar
                month={month}
                days={calendarDays}
                selectedDate={today}
                onSelectDate={() => { /* vista fixa no dia de hoje */ }}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                postos={postos}
                postoFilter={postoFilter}
                onPostoChange={setPostoFilter}
              />
            )}

            <div className={`${SURFACE.cardElevated} mt-4 p-4`}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {t('ux.colheitasHoje.resumoHoje')}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {formatCalendarDatePt(today)}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
                  {agendamentos.length}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {t('ux.colheitasHoje.totalAgendamentos')}
                </span>
              </div>
              {pendentes.length > 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  {t('ux.colheitasHoje.pendentes', { count: pendentes.length })}
                </p>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className={PANEL.table}>
              <header className={`${PANEL.tableHead} px-4 py-3 flex items-center gap-2`}>
                <CalendarClock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formatCalendarDatePt(today)}
                </h3>
                <span className="ml-auto text-xs font-medium text-slate-500 dark:text-slate-400">
                  {agendamentos.length} {t('ux.colheitasHoje.agendamentoCount')}
                </span>
              </header>

              {loadingList ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t('common.loading')}
                </div>
              ) : agendamentos.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title={t('ux.colheitasHoje.empty')}
                  description={t('ux.colheitasHoje.emptyHint')}
                />
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {agendamentos.map((ag) => (
                    <li key={ag.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {ag.paciente_nome}
                          </span>
                          <StatusBadge
                            status={ag.processo_status}
                            map={PROCESS_STATUS_STYLES}
                            className="text-[11px] px-1.5 py-0.5"
                          />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {ag.posto_nome && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ag.posto_nome}
                            </span>
                          )}
                          {ag.periodo && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {ag.periodo}
                            </span>
                          )}
                          {ag.kit_codigo && (
                            <span className="font-mono text-teal-600 dark:text-teal-400">
                              Kit: {ag.kit_codigo}
                            </span>
                          )}
                          {ag.numero_processo && (
                            <span className="font-mono text-slate-500">#{ag.numero_processo}</span>
                          )}
                        </div>
                      </div>

                      {podeRegistarColheita(ag) && (
                        <button
                          type="button"
                          title={t('ux.colheitasHoje.registar')}
                          onClick={() => goToColheitaContacto(ag)}
                          className={`${ADD_ACTION_BUTTON_CLASS} flex-shrink-0`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t('ux.colheitasHoje.registar')}</span>
                        </button>
                      )}
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
