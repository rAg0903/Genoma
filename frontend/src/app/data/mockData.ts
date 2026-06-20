import { Contact, Processo, Kit, Lote, Utilizador, Empresa, Teste, ItemPesquisa, SistemaSaude, Posto, RequisicaoKit, MovimentoKit } from './types';

export const mockContacts: Contact[] = [
  { id: '1', nome: 'João Silva Santos', data_nascimento: '1985-03-15', genero: 'Masculino', nif: '123456789', telemovel: '+351 912 345 678', email: 'joao.silva@email.com', morada: 'Rua das Flores, 123, 1000-001 Lisboa', created_at: '2025-10-10T10:00:00Z' },
  { id: '2', nome: 'Maria Fernandes Costa', data_nascimento: '1990-07-22', genero: 'Feminino', nif: '987654321', telemovel: '+351 916 543 210', email: 'maria.costa@email.com', morada: 'Avenida da República, 45, 4000-100 Porto', created_at: '2025-11-15T14:30:00Z' },
  { id: '3', nome: 'Pedro Miguel Oliveira', data_nascimento: '1978-11-08', genero: 'Masculino', nif: '456789123', telemovel: '+351 918 765 432', email: 'pedro.oliveira@email.com', morada: 'Praça do Comércio, 78, 3000-300 Coimbra', created_at: '2025-12-01T09:15:00Z' },
  { id: '4', nome: 'Ana Rita Pereira', data_nascimento: '1995-05-14', genero: 'Feminino', nif: '789123456', telemovel: '+351 913 456 789', email: 'ana.pereira@email.com', morada: 'Rua Nova, 56, 2000-200 Santarém', created_at: '2026-01-10T16:45:00Z' },
  { id: '5', nome: 'Carlos Eduardo Rodrigues', data_nascimento: '1982-09-30', genero: 'Masculino', nif: '321654987', telemovel: '+351 919 876 543', email: 'carlos.rodrigues@email.com', morada: 'Largo do Município, 12, 5000-500 Vila Real', created_at: '2026-01-20T11:20:00Z' },
  { id: '6', nome: 'Sofia Isabel Martins', data_nascimento: '1993-02-18', genero: 'Feminino', nif: '654987321', telemovel: '+351 911 234 567', email: 'sofia.martins@email.com', morada: 'Rua do Castelo, 33, 7000-700 Évora', created_at: '2026-02-05T08:30:00Z' },
  { id: '7', nome: 'Rui António Figueiredo', data_nascimento: '1971-06-25', genero: 'Masculino', nif: '147258369', telemovel: '+351 914 567 890', email: 'rui.figueiredo@email.com', morada: 'Avenida Central, 89, 4700-300 Braga', created_at: '2026-02-18T15:00:00Z' },
  { id: '8', nome: 'Catarina Lima Sousa', data_nascimento: '1988-12-03', genero: 'Feminino', nif: '369258147', telemovel: '+351 917 890 123', email: 'catarina.sousa@email.com', morada: 'Rua do Mar, 7, 8000-800 Faro', created_at: '2026-03-01T10:45:00Z' },
];

export const mockProcessos: Processo[] = [
  { id: '1', numero: 'PROC-2026-001', paciente_id: '1', paciente_nome: 'João Silva Santos', medico: 'Dr. António Ferreira', posto: 'Laboratório Central Lisboa', kit_codigo: 'KIT-A001-2026', estado: 'Faturado', data_entrada: '2026-01-15', teste: 'Análise Genética Completa', observacoes: 'Resultado dentro dos parâmetros normais' },
  { id: '2', numero: 'PROC-2026-002', paciente_id: '2', paciente_nome: 'Maria Fernandes Costa', medico: 'Dra. Sandra Lopes', posto: 'Clínica Porto Norte', kit_codigo: 'KIT-A002-2026', estado: 'Validado', data_entrada: '2026-01-22', teste: 'Teste BRCA1/BRCA2', observacoes: 'Variante benigna identificada' },
  { id: '3', numero: 'PROC-2026-003', paciente_id: '3', paciente_nome: 'Pedro Miguel Oliveira', medico: 'Dr. João Mendes', posto: 'Hospital Coimbra', kit_codigo: 'KIT-B001-2026', estado: 'Em Analise', data_entrada: '2026-02-10', teste: 'Cariotipagem', observacoes: '' },
  { id: '4', numero: 'PROC-2026-004', paciente_id: '4', paciente_nome: 'Ana Rita Pereira', medico: 'Dr. António Ferreira', posto: 'Laboratório Central Lisboa', kit_codigo: 'KIT-B002-2026', estado: 'Resultado Disponivel', data_entrada: '2026-02-14', teste: 'Painel Cardiovascular', observacoes: 'Variante detetada - seguimento necessário' },
  { id: '5', numero: 'PROC-2026-005', paciente_id: '5', paciente_nome: 'Carlos Eduardo Rodrigues', medico: 'Dr. Miguel Santos', posto: 'Posto Vila Real', kit_codigo: 'KIT-C001-2026', estado: 'Enviado Laboratorio', data_entrada: '2026-02-20', teste: 'Análise Genética Completa', observacoes: '' },
  { id: '6', numero: 'PROC-2026-006', paciente_id: '6', paciente_nome: 'Sofia Isabel Martins', medico: 'Dra. Sandra Lopes', posto: 'Clínica Évora', kit_codigo: 'KIT-C002-2026', estado: 'Colheita Realizada', data_entrada: '2026-03-05', teste: 'Teste BRCA1/BRCA2', observacoes: '' },
  { id: '7', numero: 'PROC-2026-007', paciente_id: '7', paciente_nome: 'Rui António Figueiredo', medico: 'Dr. João Mendes', posto: 'Clínica Braga', kit_codigo: 'KIT-D001-2026', estado: 'Kit Reservado', data_entrada: '2026-03-10', teste: 'Painel Cardiovascular', observacoes: '' },
  { id: '8', numero: 'PROC-2026-008', paciente_id: '8', paciente_nome: 'Catarina Lima Sousa', medico: 'Dra. Ana Correia', posto: 'Clínica Faro', kit_codigo: 'KIT-D002-2026', estado: 'Agendado', data_entrada: '2026-03-15', teste: 'Cariotipagem', observacoes: '' },
  { id: '9', numero: 'PROC-2026-009', paciente_id: '1', paciente_nome: 'João Silva Santos', medico: 'Dr. António Ferreira', posto: 'Laboratório Central Lisboa', kit_codigo: 'KIT-E001-2026', estado: 'Agendado', data_entrada: '2026-03-20', teste: 'Análise Genética Completa', observacoes: '' },
  { id: '10', numero: 'PROC-2026-010', paciente_id: '2', paciente_nome: 'Maria Fernandes Costa', medico: 'Dra. Sandra Lopes', posto: 'Clínica Porto Norte', kit_codigo: 'KIT-E002-2026', estado: 'Agendado', data_entrada: '2026-03-25', teste: 'Painel Neurológico', observacoes: '' },
];

export const mockKits: Kit[] = [
  { id: '1', codigo_barras: 'KIT-A001-2026', tipo_kit: 'Kit Genético Standard', lote: 'LOTE-2026-A', status: 'Utilizado', data_validade: '2027-06-30', localizacao: 'Laboratorio' },
  { id: '2', codigo_barras: 'KIT-A002-2026', tipo_kit: 'Kit BRCA', lote: 'LOTE-2026-A', status: 'Utilizado', data_validade: '2027-06-30', localizacao: 'Laboratorio' },
  { id: '3', codigo_barras: 'KIT-B001-2026', tipo_kit: 'Kit Cariotipagem', lote: 'LOTE-2026-B', status: 'Utilizado', data_validade: '2027-09-30', localizacao: 'Laboratorio' },
  { id: '4', codigo_barras: 'KIT-B002-2026', tipo_kit: 'Kit Cardiovascular', lote: 'LOTE-2026-B', status: 'Utilizado', data_validade: '2027-09-30', localizacao: 'Laboratorio' },
  { id: '5', codigo_barras: 'KIT-C001-2026', tipo_kit: 'Kit Genético Standard', lote: 'LOTE-2026-C', status: 'Utilizado', data_validade: '2027-12-31', localizacao: 'Laboratorio' },
  { id: '6', codigo_barras: 'KIT-C002-2026', tipo_kit: 'Kit BRCA', lote: 'LOTE-2026-C', status: 'Em trânsito', data_validade: '2027-12-31', localizacao: 'Escritorio' },
  { id: '7', codigo_barras: 'KIT-D001-2026', tipo_kit: 'Kit Cardiovascular', lote: 'LOTE-2026-C', status: 'Em trânsito', data_validade: '2027-12-31', localizacao: 'Escritorio' },
  { id: '8', codigo_barras: 'KIT-D002-2026', tipo_kit: 'Kit Cariotipagem', lote: 'LOTE-2026-D', status: 'Disponível', data_validade: '2028-03-31', localizacao: 'Escritorio' },
  { id: '9', codigo_barras: 'KIT-E001-2026', tipo_kit: 'Kit Genético Standard', lote: 'LOTE-2026-D', status: 'Disponível', data_validade: '2028-03-31', localizacao: 'Posto' },
  { id: '10', codigo_barras: 'KIT-E002-2026', tipo_kit: 'Kit Neurológico', lote: 'LOTE-2026-D', status: 'Disponível', data_validade: '2028-03-31', localizacao: 'Posto' },
  { id: '11', codigo_barras: 'KIT-F001-2026', tipo_kit: 'Kit Genético Standard', lote: 'LOTE-2026-D', status: 'Disponível', data_validade: '2028-03-31', localizacao: 'Escritorio' },
  { id: '12', codigo_barras: 'KIT-F002-2026', tipo_kit: 'Kit BRCA', lote: 'LOTE-2026-D', status: 'Disponível', data_validade: '2028-03-31', localizacao: 'Escritorio' },
  { id: '13', codigo_barras: 'KIT-G001-2025', tipo_kit: 'Kit Genético Standard', lote: 'LOTE-2025-Z', status: 'Inválido', data_validade: '2025-12-31', localizacao: 'Escritorio' },
  { id: '14', codigo_barras: 'KIT-G002-2025', tipo_kit: 'Kit BRCA', lote: 'LOTE-2025-Z', status: 'Inválido', data_validade: '2025-12-31', localizacao: 'Escritorio' },
  { id: '15', codigo_barras: 'KIT-H001-2026', tipo_kit: 'Kit Neurológico', lote: 'LOTE-2026-D', status: 'Disponível', data_validade: '2028-03-31', localizacao: 'Posto' },
];

export const mockLotes: Lote[] = [
  { id: '1', codigo: 'LOTE-2025-Z', tipo_kit: 'Misto', quantidade_total: 50, quantidade_disponivel: 0, data_rececao: '2025-01-01', data_validade: '2025-12-31', fornecedor: 'GeneTech Labs' },
  { id: '2', codigo: 'LOTE-2026-A', tipo_kit: 'Genético / BRCA', quantidade_total: 30, quantidade_disponivel: 0, data_rececao: '2026-01-01', data_validade: '2027-06-30', fornecedor: 'BioMed Solutions' },
  { id: '3', codigo: 'LOTE-2026-B', tipo_kit: 'Cariotipagem / Cardiovascular', quantidade_total: 25, quantidade_disponivel: 0, data_rececao: '2026-01-15', data_validade: '2027-09-30', fornecedor: 'GeneTech Labs' },
  { id: '4', codigo: 'LOTE-2026-C', tipo_kit: 'Misto', quantidade_total: 40, quantidade_disponivel: 12, data_rececao: '2026-02-01', data_validade: '2027-12-31', fornecedor: 'LabPro Ibérica' },
  { id: '5', codigo: 'LOTE-2026-D', tipo_kit: 'Misto Premium', quantidade_total: 60, quantidade_disponivel: 53, data_rececao: '2026-03-01', data_validade: '2028-03-31', fornecedor: 'BioMed Solutions' },
];

export const mockUtilizadores: Utilizador[] = [
  { id: '1', nome: 'Dr. Maria Silva', email: 'maria.silva@healthcrm.pt', perfil: 'Administrador', ativo: true },
  { id: '2', nome: 'Dr. António Ferreira', email: 'antonio.ferreira@healthcrm.pt', perfil: 'Médico', ativo: true },
  { id: '3', nome: 'Dra. Sandra Lopes', email: 'sandra.lopes@healthcrm.pt', perfil: 'Médico', ativo: true },
  { id: '4', nome: 'Dr. João Mendes', email: 'joao.mendes@healthcrm.pt', perfil: 'Médico', ativo: true },
  { id: '5', nome: 'Ana Rodrigues', email: 'ana.rodrigues@healthcrm.pt', perfil: 'Assistente', ativo: true },
  { id: '6', nome: 'Dra. Ana Correia', email: 'ana.correia@healthcrm.pt', perfil: 'Médico', ativo: false },
  { id: '7', nome: 'Dr. Miguel Santos', email: 'miguel.santos@healthcrm.pt', perfil: 'Médico', ativo: true },
];

export const mockEmpresas: Empresa[] = [
  { id: '1', nome: 'GeneTech Labs Portugal', morada: 'Parque Tecnológico de Lisboa, Ed. C, 1600-546 Lisboa', contacto: '+351 210 123 456', email: 'info@genetech.pt', nif: '506789123' },
  { id: '2', nome: 'BioMed Solutions', morada: 'Rua Dr. Plácido Costa, 234, 4200-450 Porto', contacto: '+351 220 987 654', email: 'contact@biomed.pt', nif: '508456789' },
  { id: '3', nome: 'LabPro Ibérica', morada: 'Zona Industrial de Évora, Lote 45, 7000-890 Évora', contacto: '+351 266 345 678', email: 'labpro@labpro.pt', nif: '507123456' },
];

export const mockTestes: Teste[] = [
  { id: '1', nome: 'Análise Genética Completa', descricao: 'Análise completa do genoma, incluindo variantes de significância clínica', preco: 850.00, codigo: 'AGC-001' },
  { id: '2', nome: 'Teste BRCA1/BRCA2', descricao: 'Análise dos genes BRCA1 e BRCA2 para risco de cancro da mama e ovário', preco: 450.00, codigo: 'BRCA-001' },
  { id: '3', nome: 'Cariotipagem', descricao: 'Análise cromossómica para deteção de anomalias numéricas e estruturais', preco: 320.00, codigo: 'CARIO-001' },
  { id: '4', nome: 'Painel Cardiovascular', descricao: 'Painel genético para doenças cardiovasculares hereditárias', preco: 620.00, codigo: 'CARDIO-001' },
  { id: '5', nome: 'Painel Neurológico', descricao: 'Análise genética para doenças neurológicas hereditárias', preco: 720.00, codigo: 'NEURO-001' },
];

export const mockItensPesquisa: ItemPesquisa[] = [
  { id: '1', codigo: 'T1', descricao: 'Trissomia 1' },
  { id: '2', codigo: 'T21', descricao: 'Trissomia 21 (Síndrome de Down)' },
  { id: '3', codigo: 'T18', descricao: 'Trissomia 18 (Síndrome de Edwards)' },
  { id: '4', codigo: 'T13', descricao: 'Trissomia 13 (Síndrome de Patau)' },
  { id: '5', codigo: 'XO', descricao: 'Síndrome de Turner' },
  { id: '6', codigo: 'XXY', descricao: 'Síndrome de Klinefelter' },
  { id: '7', codigo: 'DEL22Q', descricao: 'Deleção 22q11.2 (Síndrome DiGeorge)' },
];

export const mockSistemasSaude: SistemaSaude[] = [
  { id: '1', nome: 'ADSE' },
  { id: '2', nome: 'Advancecare' },
  { id: '3', nome: 'Alianz' },
  { id: '4', nome: 'Generali' },
  { id: '5', nome: 'Lusitânia' },
  { id: '6', nome: 'Medis' },
  { id: '7', nome: 'Multicare' },
  { id: '8', nome: 'SAMS Norte' },
  { id: '9', nome: 'SAMS Quadros' },
  { id: '10', nome: 'Serviços Sociais CGD' },
  { id: '11', nome: 'Vitoria' },
];

export const mockPostos: Posto[] = [
  { id: '1', nome: 'Laboratório Central Lisboa', codigo: 'LCL-001', localizacao: 'Av. da Liberdade, 100, 1250-145 Lisboa' },
  { id: '2', nome: 'Clínica Porto Norte', codigo: 'CPN-001', localizacao: 'Rua de Santa Catarina, 234, 4000-447 Porto' },
  { id: '3', nome: 'Hospital Coimbra', codigo: 'HUC-001', localizacao: 'Praceta Mota Pinto, 3000-075 Coimbra' },
  { id: '4', nome: 'Posto Vila Real', codigo: 'PVR-001', localizacao: 'Av. da Europa, 45, 5000-651 Vila Real' },
  { id: '5', nome: 'Clínica Faro', codigo: 'CLF-001', localizacao: 'Rua de Santo António, 67, 8000-284 Faro' },
  { id: '6', nome: 'Clínica Évora', codigo: 'CLE-001', localizacao: 'Praça do Giraldo, 12, 7000-508 Évora' },
  { id: '7', nome: 'Clínica Braga', codigo: 'CLB-001', localizacao: 'Rua do Souto, 56, 4700-430 Braga' },
];

export const mockRequisicoesKits: RequisicaoKit[] = [
  {
    id: 'REQ-001',
    data: '2026-04-10',
    origem: 'Escritorio',
    destino: 'Posto',
    quantidade: 12,
    status: 'Em trânsito',
    tracking_number: 'CTT-PT-882731',
    transportadora: 'CTT Expresso',
    lote_codigo: 'LOTE-2026-D',
    observacoes: 'Reposição semanal - Posto Porto Norte'
  },
  {
    id: 'REQ-002',
    data: '2026-04-08',
    origem: 'Escritorio',
    destino: 'Posto',
    quantidade: 8,
    status: 'Entregue',
    tracking_number: 'DHL-453123',
    transportadora: 'DHL',
    lote_codigo: 'LOTE-2026-C',
    observacoes: 'Urgente para agenda de colheitas'
  }
];

export const mockMovimentosKits: MovimentoKit[] = [
  {
    id: 'MOV-001',
    data: '2026-04-09',
    kit_codigo: 'KIT-E001-2026',
    origem: 'Posto',
    destino: 'Laboratorio',
    motivo: 'SMS Colheita',
    observacoes: 'SMS do posto: kit usado em colheita'
  },
  {
    id: 'MOV-002',
    data: '2026-04-07',
    kit_codigo: 'KIT-F001-2026',
    origem: 'Escritorio',
    destino: 'Posto',
    motivo: 'Envio',
    observacoes: 'Transferência normal de stock'
  }
];
