const normalize = (value) => (value || '').trim().toLowerCase();

const isMedicoPerfil = (perfilNome) => {
  const p = normalize(perfilNome);
  return p === 'medico' || p === 'médico';
};

const isFeminino = (genero) => {
  const g = normalize(genero);
  return g === 'feminino' || g === 'f' || g === 'female';
};

const mergeTituloNome = (titulo, nome) => {
  const n = (nome || '').trim();
  const t = (titulo || '').trim();
  if (!n) return '';
  if (!t) return n;
  const tNorm = t.replace(/\.$/, '').toLowerCase();
  const nLower = n.toLowerCase();
  if (nLower.startsWith(`${tNorm} `) || nLower.startsWith(`${t.toLowerCase()} `)) return n;
  if (nLower === tNorm) return n;
  return `${t} ${n}`.replace(/\s+/g, ' ').trim();
};

/**
 * Referência legível do utilizador que executou uma ação.
 * Ex.: "O Administrador Nuno Araújo", "A Médica Dra. Ana Clara da Costa Ferreira"
 */
exports.formatUtilizadorReferencia = ({
  nome,
  perfil_nome: perfilNome,
  medico_titulo: medicoTitulo,
  medico_genero: medicoGenero,
} = {}) => {
  const nomeBase = (nome || '').trim();
  if (!nomeBase) return 'Utilizador';

  if (isMedicoPerfil(perfilNome)) {
    const nomeCompleto = mergeTituloNome(medicoTitulo, nomeBase);
    const artigo = isFeminino(medicoGenero) ? 'A Médica' : 'O Médico';
    return `${artigo} ${nomeCompleto}`;
  }

  const perfil = (perfilNome || '').trim();
  const perfilLower = normalize(perfil);
  const nomeCompleto = mergeTituloNome(null, nomeBase);

  if (perfilLower === 'administrador') {
    return `O Administrador ${nomeCompleto}`;
  }
  if (perfilLower === 'assistente') {
    return `O Assistente ${nomeCompleto}`;
  }
  if (perfil) {
    return `O ${perfil} ${nomeCompleto}`;
  }

  return nomeCompleto;
};

/** Sufixo « do contacto X » (sem distinção de género). */
exports.suffixContacto = (nome) => {
  const n = (nome || '').trim();
  if (!n) return '';
  return ` do contacto ${n}`;
};

/** Médico prescritor associado a um contacto (com título Dr./Dra.). */
exports.formatMedicoReferencia = ({
  nome,
  titulo,
  genero,
} = {}) => {
  const nomeCompleto = mergeTituloNome(titulo, nome);
  if (!nomeCompleto) return 'médico';
  const artigo = isFeminino(genero) ? 'A Médica' : 'O Médico';
  return `${artigo} ${nomeCompleto}`;
};
