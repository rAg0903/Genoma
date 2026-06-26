import type { Dispatch, SetStateAction } from 'react';
import { apiRequest } from './api';
import { getAuthToken } from './api-processos';

export interface PortuguesePostalLookup {
  codigo_postal: string;
  distrito: string;
  cidade: string;
  pais?: string;
}

export type PostalAddressFields = {
  codigo_postal?: string;
  cidade?: string;
  distrito?: string;
  pais?: string;
};

export type PostalAutofillOptions = {
  fillPais?: boolean;
  fillDistrito?: boolean;
  fillCidade?: boolean;
};

const DEFAULT_AUTOFILL_OPTIONS: Required<PostalAutofillOptions> = {
  fillPais: true,
  fillDistrito: true,
  fillCidade: true,
};

interface GeoApiPostalResponse {
  CP?: string;
  Distrito?: string;
  Concelho?: string;
  Localidade?: string;
}

const GEO_API_BASE = 'https://json.geoapi.pt/cp';

/** Normaliza para o formato português XXXX-XXX. */
export function normalizePortuguesePostalCode(raw: string): string | null {
  const match = raw.trim().match(/^(\d{4})-?(\d{3})$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

async function fetchPostalCodeDirect(cp: string): Promise<GeoApiPostalResponse | null> {
  try {
    const res = await fetch(`${GEO_API_BASE}/${encodeURIComponent(cp)}`);
    if (!res.ok) return null;
    return (await res.json()) as GeoApiPostalResponse;
  } catch {
    return null;
  }
}

function mapResponse(codigoPostal: string, data: GeoApiPostalResponse): PortuguesePostalLookup | null {
  const distrito = String(data.Distrito || '').trim();
  const cidade = String(data.Concelho || data.Localidade || '').trim();
  if (!distrito && !cidade) return null;
  return { codigo_postal: codigoPostal, distrito, cidade, pais: 'Portugal' };
}

async function lookupViaBackend(codigoPostal: string): Promise<PortuguesePostalLookup | null> {
  const token = getAuthToken();
  if (!token) return null;
  try {
    return await apiRequest<PortuguesePostalLookup>(`/codigo-postal/${encodeURIComponent(codigoPostal)}`, { token });
  } catch {
    return null;
  }
}

async function lookupViaDirectApi(codigoPostal: string): Promise<PortuguesePostalLookup | null> {
  const cp4 = codigoPostal.slice(0, 4);
  const data = (await fetchPostalCodeDirect(codigoPostal)) ?? (await fetchPostalCodeDirect(cp4));
  if (!data) return null;
  if ('msg' in data && data.msg) return null;
  return mapResponse(codigoPostal, data);
}

/**
 * Obtém distrito, cidade e país a partir de um código postal português.
 * Preferência: API interna (dados locais + proxy opcional geoapi.pt).
 */
export async function lookupPortuguesePostalCode(raw: string): Promise<PortuguesePostalLookup | null> {
  const codigoPostal = normalizePortuguesePostalCode(raw);
  if (!codigoPostal) return null;

  return (await lookupViaBackend(codigoPostal)) ?? (await lookupViaDirectApi(codigoPostal));
}

export function mergePostalLookup<T extends PostalAddressFields>(
  prev: T,
  lookup: PortuguesePostalLookup,
  options: PostalAutofillOptions = DEFAULT_AUTOFILL_OPTIONS,
): T {
  const opts = { ...DEFAULT_AUTOFILL_OPTIONS, ...options };
  const patch: PostalAddressFields = { codigo_postal: lookup.codigo_postal };
  if (opts.fillPais) patch.pais = lookup.pais || 'Portugal';
  if (opts.fillDistrito) patch.distrito = lookup.distrito;
  if (opts.fillCidade) patch.cidade = lookup.cidade;
  return { ...prev, ...patch };
}

/** Handlers reutilizáveis para campos de morada com código postal português. */
export function createPostalCodeAutofillHandlers<T extends PostalAddressFields>(
  setForm: Dispatch<SetStateAction<T>>,
  options?: PostalAutofillOptions,
) {
  const autofillFromCp = async (cp: string) => {
    const normalized = normalizePortuguesePostalCode(cp);
    if (!normalized) return;
    const lookup = await lookupPortuguesePostalCode(cp);
    if (!lookup) return;
    setForm((prev) => {
      if (normalizePortuguesePostalCode(prev.codigo_postal || '') !== normalized) return prev;
      return mergePostalLookup(prev, lookup, options);
    });
  };

  const handleCodigoPostalChange = (value: string) => {
    setForm((prev) => {
      const oldNorm = normalizePortuguesePostalCode(prev.codigo_postal || '');
      const newNorm = normalizePortuguesePostalCode(value);
      const next = { ...prev, codigo_postal: value } as T;
      if (newNorm && newNorm !== oldNorm) {
        const opts = { ...DEFAULT_AUTOFILL_OPTIONS, ...options };
        if (opts.fillCidade) next.cidade = '';
        if (opts.fillDistrito) next.distrito = '';
      }
      return next;
    });
    void autofillFromCp(value);
  };

  return { handleCodigoPostalChange, autofillFromCp };
}
