import { apiRequest } from './api';

export type ConfiguracaoSistema = {
  clinica_nome: string;
  clinica_morada: string;
  clinica_codigo_postal: string;
  clinica_telefone: string;
  clinica_email: string;
  updated_at?: string | null;
};

const getToken = () =>
  window.localStorage.getItem('token')
  || window.localStorage.getItem('authToken')
  || window.sessionStorage.getItem('token')
  || undefined;

export const configuracaoApi = {
  getSistema: () =>
    apiRequest<{ data: ConfiguracaoSistema }>('/configuracao/sistema', { token: getToken() }),

  saveSistema: (data: Partial<ConfiguracaoSistema>) =>
    apiRequest<{ message: string; data: ConfiguracaoSistema }>('/configuracao/sistema', {
      method: 'PUT',
      token: getToken(),
      body: data,
    }),
};
