import { lazy, ReactNode, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { MainLayout } from './components/MainLayout';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './context/AuthContext';
import { ConfirmDeleteProvider } from './context/ConfirmDeleteContext';
import { ConfirmActionProvider } from './context/ConfirmActionContext';
import { GlobalSearchProvider } from './context/GlobalSearchContext';
import { PermissionModule } from '../lib/permissions';
import { AccessDeniedState } from './components/shared/AccessDeniedState';
import { PageLoadingSkeleton } from './components/shared/PageSkeletons';
import { getAuthToken } from '../lib/auth-session';

const DashboardPage = lazy(() => import('./components/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ContactsPage = lazy(() => import('./components/ContactsPage').then((m) => ({ default: m.ContactsPage })));
const ContactFormPage = lazy(() => import('./components/ContactFormPage').then((m) => ({ default: m.ContactFormPage })));
const ProcessesPage = lazy(() => import('./components/ProcessesPage').then((m) => ({ default: m.ProcessesPage })));
const ProcessFormPage = lazy(() => import('./components/ProcessFormPage').then((m) => ({ default: m.ProcessFormPage })));
const ProcessViewPage = lazy(() => import('./components/ProcessViewPage').then((m) => ({ default: m.ProcessViewPage })));
const StocksPage = lazy(() => import('./components/StocksPage').then((m) => ({ default: m.StocksPage })));
const ListingsPage = lazy(() => import('./components/listagens/ListingsPage').then((m) => ({ default: m.ListingsPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const MedicoFormPage = lazy(() => import('./components/MedicoFormPage').then((m) => ({ default: m.MedicoFormPage })));
const PostoFormPage = lazy(() => import('./components/LocalFormPage').then((m) => ({ default: m.PostoFormPage })));
const LaboratorioFormPage = lazy(() => import('./components/LocalFormPage').then((m) => ({ default: m.LaboratorioFormPage })));
const LaboratorioFinalFormPage = lazy(() => import('./components/LocalFormPage').then((m) => ({ default: m.LaboratorioFinalFormPage })));
const EntidadeFormPage = lazy(() => import('./components/LocalFormPage').then((m) => ({ default: m.EntidadeFormPage })));
const EmpresaFormPage = lazy(() => import('./components/EmpresaFormPage').then((m) => ({ default: m.EmpresaFormPage })));
const TesteFormPage = lazy(() => import('./components/TesteFormPage').then((m) => ({ default: m.TesteFormPage })));
const SubTesteFormPage = lazy(() => import('./components/SubTesteFormPage').then((m) => ({ default: m.SubTesteFormPage })));
const ProfilePage = lazy(() => import('./components/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const NotificationsPage = lazy(() => import('./components/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const ForgotPasswordPage = lazy(() => import('./components/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ColheitasDoDiaPage = lazy(() => import('./components/ColheitasDoDiaPage').then((m) => ({ default: m.ColheitasDoDiaPage })));
const NotFoundPage = lazy(() => import('./components/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const SHOW_404_PREVIEW = false;

const MODULE_LABELS: Record<PermissionModule, string> = {
  dashboard: 'Dashboard',
  contactos: 'Contactos',
  processos: 'Processos',
  stocks: 'Stocks',
  listagens: 'Listagens',
  definicoes: 'Administracao',
};

function ProtectedRoute({ module, children }: { module: PermissionModule; children: ReactNode }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(module, 'read')) {
    return <AccessDeniedState message={`O perfil atual nao tem permissao para aceder ao modulo de ${MODULE_LABELS[module]}.`} />;
  }
  return <>{children}</>;
}

function RouteLoading() {
  return (
    <div className="p-4 md:p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <PageLoadingSkeleton />
    </div>
  );
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{node}</Suspense>;
}

function SessionBootstrapping() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-4 shadow-sm">
        <p className="text-slate-500 dark:text-slate-400" style={{ fontSize: '14px' }}>A validar sessão...</p>
      </div>
    </div>
  );
}

function hasAuthToken() {
  return Boolean(getAuthToken());
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isSessionReady } = useAuth();
  if (SHOW_404_PREVIEW) {
    return <NotFoundPage />;
  }
  if (!hasAuthToken()) {
    return <Navigate to="/login" replace />;
  }
  if (!isSessionReady) {
    return <SessionBootstrapping />;
  }
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  if (hasAuthToken()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function ProtectedLayout() {
  return (
    <RequireAuth>
      <GlobalSearchProvider>
        <ConfirmDeleteProvider>
          <ConfirmActionProvider>
            <MainLayout />
          </ConfirmActionProvider>
        </ConfirmDeleteProvider>
      </GlobalSearchProvider>
    </RequireAuth>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: () => (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: '/forgot-password',
    Component: () => withSuspense(
      <GuestOnly>
        <ForgotPasswordPage />
      </GuestOnly>
    ),
  },
  {
    path: '/preview-404',
    Component: () => withSuspense(<NotFoundPage />),
  },
  {
    path: '/',
    Component: ProtectedLayout,
    children: [
      {
        index: true,
        Component: () => withSuspense(<DashboardPage />),
      },
      {
        path: 'contactos',
        Component: () => withSuspense(
          <ProtectedRoute module="contactos">
            <ContactsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'contactos/novo',
        Component: () => withSuspense(
          <ProtectedRoute module="contactos">
            <ContactFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'contactos/:id/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="contactos">
            <ContactFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'agendamentos',
        Component: () => <Navigate to="/colheitas-hoje" replace />,
      },
      {
        path: 'colheitas-hoje',
        Component: () => withSuspense(
          <ProtectedRoute module="contactos">
            <ColheitasDoDiaPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'processos',
        Component: () => withSuspense(
          <ProtectedRoute module="processos">
            <ProcessesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'processos/:id',
        Component: () => withSuspense(
          <ProtectedRoute module="processos">
            <ProcessViewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'processos/:id/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="processos">
            <ProcessFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'stocks',
        Component: () => withSuspense(
          <ProtectedRoute module="stocks">
            <StocksPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'listagens',
        Component: () => withSuspense(
          <ProtectedRoute module="listagens">
            <ListingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/medicos/novo',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <MedicoFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/medicos/:id/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <MedicoFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/utilizadores/:id/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <MedicoFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/entidades/novo',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <EntidadeFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/entidades/:id/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <EntidadeFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/empresas/novo',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <EmpresaFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/empresas/:id/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <EmpresaFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/laboratorios/final/novo',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <LaboratorioFinalFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/laboratorios/novo',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <LaboratorioFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/laboratorios/:laboratorioId/postos/novo',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <PostoFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/laboratorios/:laboratorioId/postos/:id/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <PostoFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/laboratorios/:id/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <LaboratorioFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/testes/novo',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <TesteFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/testes/:id/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <TesteFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/testes/:parentId/sub-testes/novo',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <SubTesteFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'definicoes/testes/:parentId/sub-testes/:subId/editar',
        Component: () => withSuspense(
          <ProtectedRoute module="definicoes">
            <SubTesteFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'perfil',
        Component: () => withSuspense(<ProfilePage />),
      },
      {
        path: 'notificacoes',
        Component: () => withSuspense(<NotificationsPage />),
      },
      {
        path: '*',
        Component: () => withSuspense(<NotFoundPage />),
      },
    ],
  },
]);
