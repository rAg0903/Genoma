const cpData = require('../data/cp-lookup.json');

const GEO_API_BASE = 'https://json.geoapi.pt/cp';
const GEO_API_KEY = process.env.GEOAPI_KEY || process.env.GEOAPI_PT_KEY || '';

const normalizeCp = (raw) => {
  const match = String(raw || '').trim().match(/^(\d{4})-?(\d{3})$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
};

const mapGeoApiResponse = (codigoPostal, data) => {
  if (!data || data.msg) return null;
  const distrito = String(data.Distrito || '').trim();
  const cidade = String(data.Concelho || data.Localidade || '').trim();
  if (!distrito && !cidade) return null;
  return { codigo_postal: codigoPostal, distrito, cidade, pais: 'Portugal' };
};

const lookupLocal = (codigoPostal) => {
  const direct = cpData.cp7?.[codigoPostal];
  if (direct) {
    return {
      codigo_postal: codigoPostal,
      distrito: direct.d || '',
      cidade: direct.c || '',
      pais: 'Portugal',
    };
  }

  const cp4 = codigoPostal.slice(0, 4);
  const fallback = cpData.cp4?.[cp4];
  if (fallback) {
    return {
      codigo_postal: codigoPostal,
      distrito: fallback.d || '',
      cidade: fallback.c || '',
      pais: 'Portugal',
    };
  }

  return null;
};

const fetchCp = async (cp) => {
  try {
    const url = new URL(`${GEO_API_BASE}/${encodeURIComponent(cp)}`);
    const headers = { Accept: 'application/json' };
    if (GEO_API_KEY) headers['X-API-Key'] = GEO_API_KEY;
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
};

const lookupRemote = async (codigoPostal) => {
  const cp4 = codigoPostal.slice(0, 4);
  const data = (await fetchCp(codigoPostal)) ?? (await fetchCp(cp4));
  return mapGeoApiResponse(codigoPostal, data);
};

exports.lookup = async (raw) => {
  const codigoPostal = normalizeCp(raw);
  if (!codigoPostal) {
    throw new Error('Código postal inválido. Use o formato 0000-000.');
  }

  const local = lookupLocal(codigoPostal);
  if (local) return local;

  const remote = await lookupRemote(codigoPostal);
  if (remote) return remote;

  return null;
};
