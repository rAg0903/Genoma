import type { Contact, Processo } from '../app/data/types';

export type BreadcrumbItem = { path: string; label: string };

type Translate = (key: string) => string;

const processList = (t: Translate): BreadcrumbItem => ({
  path: '/processos',
  label: t('nav.processes'),
});

const contactList = (t: Translate): BreadcrumbItem => ({
  path: '/contactos',
  label: t('nav.contacts'),
});

function resolveProcessNumero(processos: Processo[], id: string): string {
  return processos.find((p) => p.id === id)?.numero || id;
}

function resolveContactNome(contacts: Contact[], id: string): string {
  return contacts.find((c) => c.id === id)?.nome || id;
}

export function getProcessBreadcrumbItems(
  pathname: string,
  t: Translate,
  processos: Processo[],
): BreadcrumbItem[] | null {
  if (!pathname.startsWith('/processos')) return null;
  if (pathname === '/processos') return [processList(t)];

  const editMatch = pathname.match(/^\/processos\/([^/]+)\/editar$/);
  if (editMatch) {
    const id = editMatch[1];
    const numero = resolveProcessNumero(processos, id);
    return [
      processList(t),
      { path: `/processos/${id}`, label: numero },
      { path: pathname, label: t('breadcrumb.editProcess') },
    ];
  }

  const viewMatch = pathname.match(/^\/processos\/([^/]+)$/);
  if (viewMatch) {
    const id = viewMatch[1];
    return [
      processList(t),
      { path: pathname, label: resolveProcessNumero(processos, id) },
    ];
  }

  return null;
}

export function getContactBreadcrumbItems(
  pathname: string,
  t: Translate,
  contacts: Contact[],
): BreadcrumbItem[] | null {
  if (!pathname.startsWith('/contactos')) return null;
  if (pathname === '/contactos') return [contactList(t)];

  if (pathname === '/contactos/novo') {
    return [contactList(t), { path: pathname, label: t('breadcrumb.newContact') }];
  }

  const editMatch = pathname.match(/^\/contactos\/([^/]+)\/editar$/);
  if (editMatch) {
    const id = editMatch[1];
    const nome = resolveContactNome(contacts, id);
    return [
      contactList(t),
      { path: `/contactos/${id}`, label: nome },
      { path: pathname, label: t('breadcrumb.editContact') },
    ];
  }

  const viewMatch = pathname.match(/^\/contactos\/([^/]+)$/);
  if (viewMatch) {
    const id = viewMatch[1];
    return [
      contactList(t),
      { path: pathname, label: resolveContactNome(contacts, id) },
    ];
  }

  return null;
}
