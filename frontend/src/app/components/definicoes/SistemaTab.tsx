import { useEffect, useState, type FormEvent } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { configuracaoApi, type ConfiguracaoSistema } from '../../../lib/api-configuracao';
import { useLanguage } from '../../../i18n/LanguageContext';
import { CONTROL, FORM, SURFACE } from '../../../lib/design-tokens';
import { FormPageHeader, FormPrimaryButton } from '../shared/FormPageChrome';
import { AdminTabPanel } from './admin-tab-ui';

const emptyForm: ConfiguracaoSistema = {
  clinica_nome: 'GENOMA',
  clinica_morada: '',
  clinica_codigo_postal: '',
  clinica_telefone: '',
  clinica_email: '',
};

export function SistemaTab() {
  const { t } = useLanguage();
  const [form, setForm] = useState<ConfiguracaoSistema>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void configuracaoApi.getSistema()
      .then((res) => {
        if (!cancelled && res.data) {
          setForm({ ...emptyForm, ...res.data });
        }
      })
      .catch((err: Error) => {
        if (!cancelled) toast.error(err.message || t('pages.admin.sistema.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const res = await configuracaoApi.saveSistema(form);
      setForm({ ...emptyForm, ...res.data });
      toast.success(t('pages.admin.sistema.saved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('pages.admin.sistema.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminTabPanel>
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('common.loading')}
        </div>
      </AdminTabPanel>
    );
  }

  return (
    <AdminTabPanel>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <FormPageHeader
          title={t('pages.admin.sistema.title')}
          subtitle={t('pages.admin.sistema.subtitle')}
        />

        <div className={`${SURFACE.card} p-6 space-y-4`}>
          <div>
            <label className={FORM.label} htmlFor="clinica_nome">
              {t('pages.admin.sistema.fields.nome')}
            </label>
            <input
              id="clinica_nome"
              className={CONTROL.input}
              value={form.clinica_nome}
              onChange={(e) => setForm((prev) => ({ ...prev, clinica_nome: e.target.value }))}
              required
              maxLength={120}
            />
          </div>

          <div>
            <label className={FORM.label} htmlFor="clinica_morada">
              {t('pages.admin.sistema.fields.morada')}
            </label>
            <input
              id="clinica_morada"
              className={CONTROL.input}
              value={form.clinica_morada}
              onChange={(e) => setForm((prev) => ({ ...prev, clinica_morada: e.target.value }))}
              maxLength={255}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={FORM.label} htmlFor="clinica_codigo_postal">
                {t('pages.admin.sistema.fields.codigoPostal')}
              </label>
              <input
                id="clinica_codigo_postal"
                className={CONTROL.input}
                value={form.clinica_codigo_postal}
                onChange={(e) => setForm((prev) => ({ ...prev, clinica_codigo_postal: e.target.value }))}
                maxLength={32}
              />
            </div>
            <div>
              <label className={FORM.label} htmlFor="clinica_telefone">
                {t('pages.admin.sistema.fields.telefone')}
              </label>
              <input
                id="clinica_telefone"
                className={CONTROL.input}
                value={form.clinica_telefone}
                onChange={(e) => setForm((prev) => ({ ...prev, clinica_telefone: e.target.value }))}
                maxLength={40}
              />
            </div>
          </div>

          <div>
            <label className={FORM.label} htmlFor="clinica_email">
              {t('pages.admin.sistema.fields.email')}
            </label>
            <input
              id="clinica_email"
              type="email"
              className={CONTROL.input}
              value={form.clinica_email}
              onChange={(e) => setForm((prev) => ({ ...prev, clinica_email: e.target.value }))}
              maxLength={120}
            />
          </div>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('pages.admin.sistema.hint')}
        </p>

        <FormPrimaryButton type="submit" disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('common.save')}
        </FormPrimaryButton>
      </form>
    </AdminTabPanel>
  );
}
