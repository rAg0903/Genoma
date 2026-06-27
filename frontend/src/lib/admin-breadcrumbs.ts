export type BreadcrumbItem = { path: string; label: string };

type Translate = (key: string) => string;

const adminRoot = (t: Translate): BreadcrumbItem => ({
  path: '/definicoes',
  label: t('nav.administration'),
});

const adminSection = (t: Translate, tab: string, labelKey: string): BreadcrumbItem => ({
  path: `/definicoes?tab=${tab}`,
  label: t(labelKey),
});

const adminPage = (pathname: string, t: Translate, labelKey: string): BreadcrumbItem => ({
  path: pathname,
  label: t(labelKey),
});

/**
 * Breadcrumbs da Administração — padrão:
 * Administração > [Secção] > [Acção da página]
 * (ex.: Administração > Testes > Novo teste)
 */
export function getAdminBreadcrumbItems(pathname: string, t: Translate): BreadcrumbItem[] | null {
  if (!pathname.startsWith('/definicoes')) return null;

  if (pathname === '/definicoes') {
    return [adminRoot(t)];
  }

  const root = adminRoot(t);

  if (pathname === '/definicoes/entidades/novo') {
    return [root, adminSection(t, 'entidades', 'navSub.entidades'), adminPage(pathname, t, 'breadcrumb.newEntity')];
  }
  if (/^\/definicoes\/entidades\/[^/]+\/editar$/.test(pathname)) {
    return [root, adminSection(t, 'entidades', 'navSub.entidades'), adminPage(pathname, t, 'breadcrumb.editEntity')];
  }

  if (pathname === '/definicoes/empresas/novo') {
    return [root, adminSection(t, 'empresas', 'navSub.empresas'), adminPage(pathname, t, 'breadcrumb.newCompany')];
  }
  if (/^\/definicoes\/empresas\/[^/]+\/editar$/.test(pathname)) {
    return [root, adminSection(t, 'empresas', 'navSub.empresas'), adminPage(pathname, t, 'breadcrumb.editCompany')];
  }

  if (pathname === '/definicoes/testes/novo') {
    return [root, adminSection(t, 'testes', 'navSub.testes'), adminPage(pathname, t, 'nav.newTest')];
  }
  if (/^\/definicoes\/testes\/[^/]+\/editar$/.test(pathname)) {
    return [root, adminSection(t, 'testes', 'navSub.testes'), adminPage(pathname, t, 'breadcrumb.editTest')];
  }
  if (/^\/definicoes\/testes\/[^/]+\/sub-testes\/novo$/.test(pathname)) {
    return [root, adminSection(t, 'testes', 'navSub.testes'), adminPage(pathname, t, 'breadcrumb.newSubTest')];
  }
  if (/^\/definicoes\/testes\/[^/]+\/sub-testes\/[^/]+\/editar$/.test(pathname)) {
    return [root, adminSection(t, 'testes', 'navSub.testes'), adminPage(pathname, t, 'breadcrumb.editSubTest')];
  }

  if (pathname === '/definicoes/medicos/novo') {
    return [root, adminSection(t, 'medicos', 'navSub.medicos'), adminPage(pathname, t, 'nav.newDoctor')];
  }
  if (/^\/definicoes\/medicos\/[^/]+\/editar$/.test(pathname)) {
    return [root, adminSection(t, 'medicos', 'navSub.medicos'), adminPage(pathname, t, 'breadcrumb.editDoctor')];
  }

  if (/^\/definicoes\/utilizadores\/[^/]+\/editar$/.test(pathname)) {
    return [root, adminSection(t, 'utilizadores', 'navSub.utilizadores'), adminPage(pathname, t, 'breadcrumb.editUser')];
  }

  if (pathname === '/definicoes/laboratorios/novo') {
    return [root, adminSection(t, 'laboratorios', 'navSub.laboratorios'), adminPage(pathname, t, 'breadcrumb.newLaboratory')];
  }
  if (pathname === '/definicoes/laboratorios/final/novo') {
    return [root, adminSection(t, 'laboratorios', 'navSub.laboratorios'), adminPage(pathname, t, 'breadcrumb.newFinalLaboratory')];
  }
  if (/^\/definicoes\/laboratorios\/[^/]+\/editar$/.test(pathname) && !pathname.includes('/postos/')) {
    return [root, adminSection(t, 'laboratorios', 'navSub.laboratorios'), adminPage(pathname, t, 'breadcrumb.editLaboratory')];
  }
  if (/^\/definicoes\/laboratorios\/[^/]+\/postos\/novo$/.test(pathname)) {
    return [root, adminSection(t, 'laboratorios', 'navSub.laboratorios'), adminPage(pathname, t, 'breadcrumb.newPosto')];
  }
  if (/^\/definicoes\/laboratorios\/[^/]+\/postos\/[^/]+\/editar$/.test(pathname)) {
    return [root, adminSection(t, 'laboratorios', 'navSub.laboratorios'), adminPage(pathname, t, 'breadcrumb.editPosto')];
  }

  return null;
}
