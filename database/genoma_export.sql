-- ============================================================
-- CRM Genoma — exportação completa da base de dados
-- Base de dados: genoma
-- Servidor: 12.1.2-MariaDB
-- Exportado em: 2026-06-27T00:12:00.310Z
-- Gerado por: backend/src/utils/export-database.js
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `genoma` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `genoma`;

-- ------------------------------------------------------------
-- Estrutura: anexos
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `anexos`;
CREATE TABLE `anexos` (
  `id` char(36) NOT NULL,
  `paciente_id` char(36) DEFAULT NULL,
  `processo_id` char(36) DEFAULT NULL,
  `tipo` enum('Documento','Email','Outro') DEFAULT 'Documento',
  `titulo` varchar(200) NOT NULL,
  `descricao` text DEFAULT NULL,
  `url` text DEFAULT NULL,
  `utilizador_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_anexos_paciente` (`paciente_id`),
  KEY `idx_anexos_processo` (`processo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: assets_resultados
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `assets_resultados`;
CREATE TABLE `assets_resultados` (
  `id` char(36) NOT NULL,
  `processo_id` char(36) DEFAULT NULL,
  `url_ficheiro` text NOT NULL,
  `tipo_ficheiro` varchar(10) DEFAULT 'PDF',
  `data_upload` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_assets_processo` (`processo_id`),
  CONSTRAINT `fk_assets_resultados_processos` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: colheitas
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `colheitas`;
CREATE TABLE `colheitas` (
  `id` char(36) NOT NULL,
  `processo_id` char(36) DEFAULT NULL,
  `posto_id` char(36) DEFAULT NULL,
  `data_prevista` date DEFAULT NULL,
  `periodo` enum('Manhã','Tarde','Noite') DEFAULT NULL,
  `data_efetiva` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_colheita_processo` (`processo_id`),
  KEY `fk_colheita_posto` (`posto_id`),
  KEY `idx_colheitas_posto_data` (`posto_id`,`data_prevista`),
  KEY `idx_colheitas_data` (`data_prevista`),
  CONSTRAINT `fk_colheitas_postos` FOREIGN KEY (`posto_id`) REFERENCES `postos` (`id`),
  CONSTRAINT `fk_colheitas_processos` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: empresas
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `empresas`;
CREATE TABLE `empresas` (
  `id` char(36) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `morada` text DEFAULT NULL,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `ativo` tinyint(1) DEFAULT 1,
  `tipo_empresa` varchar(50) DEFAULT NULL,
  `nif` varchar(20) DEFAULT NULL,
  `pais` varchar(50) DEFAULT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: entidade_condicoes_testes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `entidade_condicoes_testes`;
CREATE TABLE `entidade_condicoes_testes` (
  `id` char(36) NOT NULL,
  `entidade_id` char(36) NOT NULL,
  `teste_id` char(36) NOT NULL,
  `comissao` decimal(10,2) DEFAULT NULL,
  `prazo_pagamento_dias` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_entidade_teste` (`entidade_id`,`teste_id`),
  KEY `idx_entidade_condicoes_entidade` (`entidade_id`),
  KEY `fk_entidade_condicoes_teste` (`teste_id`),
  CONSTRAINT `fk_entidade_condicoes_entidade` FOREIGN KEY (`entidade_id`) REFERENCES `entidades` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_entidade_condicoes_teste` FOREIGN KEY (`teste_id`) REFERENCES `testes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: entidade_contactos_secundarios
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `entidade_contactos_secundarios`;
CREATE TABLE `entidade_contactos_secundarios` (
  `id` char(36) NOT NULL,
  `entidade_id` char(36) NOT NULL,
  `ordem` tinyint(4) NOT NULL DEFAULT 1,
  `nome` varchar(120) DEFAULT NULL,
  `funcao` varchar(120) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_entidade_contactos_entidade` (`entidade_id`),
  CONSTRAINT `fk_entidade_contactos_entidade` FOREIGN KEY (`entidade_id`) REFERENCES `entidades` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: entidades
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `entidades`;
CREATE TABLE `entidades` (
  `id` char(36) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `codigo` varchar(40) DEFAULT NULL,
  `morada` varchar(255) DEFAULT NULL,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `cidade` varchar(80) DEFAULT NULL,
  `distrito` varchar(80) DEFAULT NULL,
  `pais` varchar(80) DEFAULT NULL,
  `contacto` varchar(30) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_entidades_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: facturacao
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `facturacao`;
CREATE TABLE `facturacao` (
  `id` char(36) NOT NULL,
  `processo_id` char(36) DEFAULT NULL,
  `preco_teste` decimal(10,2) DEFAULT 0.00,
  `numero_fatura` varchar(50) DEFAULT NULL,
  `data_fatura` date DEFAULT NULL,
  `entidade_multibanco` varchar(20) DEFAULT NULL,
  `referencia_multibanco` varchar(20) DEFAULT NULL,
  `comissao` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_facturacao_processo` (`processo_id`),
  CONSTRAINT `fk_facturacao_processos` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: informacao_clinica
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `informacao_clinica`;
CREATE TABLE `informacao_clinica` (
  `id` char(36) NOT NULL,
  `processo_id` char(36) DEFAULT NULL,
  `semanas_gravidez` int(11) DEFAULT NULL,
  `dias_gravidez` int(11) DEFAULT NULL,
  `tipo_gravidez` enum('singular','gemelar') DEFAULT NULL,
  `quer_saber_sexo` tinyint(1) DEFAULT 0,
  `motivo_prescricao` text DEFAULT NULL,
  `data_registo` timestamp NULL DEFAULT current_timestamp(),
  `gestacao_registada_em` date DEFAULT NULL COMMENT 'Data registo gestação (snapshot contacto)',
  PRIMARY KEY (`id`),
  KEY `fk_info_processo` (`processo_id`),
  CONSTRAINT `fk_informacao_clinica_processos` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: itens_pesquisa
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `itens_pesquisa`;
CREATE TABLE `itens_pesquisa` (
  `id` char(36) NOT NULL,
  `codigo` varchar(10) NOT NULL,
  `descricao` varchar(100) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: kits
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `kits`;
CREATE TABLE `kits` (
  `id` char(36) NOT NULL,
  `numero_kit` varchar(50) DEFAULT NULL,
  `tracking` varchar(100) DEFAULT NULL,
  `codigo_barras` varchar(50) NOT NULL,
  `tipo_kit_id` char(36) DEFAULT NULL,
  `lote_id` char(36) DEFAULT NULL,
  `empresa_id` char(36) DEFAULT NULL,
  `posto_id` char(36) DEFAULT NULL,
  `status` enum('Disponivel','Reservado','Em transito','Utilizado','Invalido','Perdido','Expirado') DEFAULT 'Disponivel',
  `data_validade` date DEFAULT NULL,
  `localizacao` enum('Escritorio','Posto','Laboratorio') DEFAULT 'Escritorio',
  `fase_ciclo` enum('em_empresa','em_posto_aguarda','reservado_colheita','aguarda_envio_lab','em_transito_lab','em_lab_final','encerrado') DEFAULT NULL,
  `laboratorio_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_barras` (`codigo_barras`),
  KEY `fk_lote` (`lote_id`),
  KEY `fk_empresa_kit` (`empresa_id`),
  KEY `fk_posto_kit` (`posto_id`),
  KEY `idx_kits_status_loc` (`status`,`localizacao`),
  KEY `fk_kits_laboratorio` (`laboratorio_id`),
  KEY `fk_kits_tipo_kit` (`tipo_kit_id`),
  CONSTRAINT `fk_kits_empresas` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`),
  CONSTRAINT `fk_kits_laboratorio` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`),
  CONSTRAINT `fk_kits_lotes` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`),
  CONSTRAINT `fk_kits_postos` FOREIGN KEY (`posto_id`) REFERENCES `postos` (`id`),
  CONSTRAINT `fk_kits_tipo_kit` FOREIGN KEY (`tipo_kit_id`) REFERENCES `tipos_kit` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: laboratorio_condicoes_testes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `laboratorio_condicoes_testes`;
CREATE TABLE `laboratorio_condicoes_testes` (
  `id` char(36) NOT NULL,
  `laboratorio_id` char(36) NOT NULL,
  `teste_id` char(36) NOT NULL,
  `comissao` decimal(10,2) DEFAULT NULL,
  `prazo_pagamento_dias` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_laboratorio_teste` (`laboratorio_id`,`teste_id`),
  KEY `idx_laboratorio_condicoes_lab` (`laboratorio_id`),
  KEY `fk_laboratorio_condicoes_teste` (`teste_id`),
  CONSTRAINT `fk_laboratorio_condicoes_lab` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_laboratorio_condicoes_teste` FOREIGN KEY (`teste_id`) REFERENCES `testes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: laboratorio_contactos_secundarios
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `laboratorio_contactos_secundarios`;
CREATE TABLE `laboratorio_contactos_secundarios` (
  `id` char(36) NOT NULL,
  `laboratorio_id` char(36) NOT NULL,
  `ordem` tinyint(4) NOT NULL DEFAULT 1,
  `nome` varchar(120) DEFAULT NULL,
  `funcao` varchar(120) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_laboratorio_contactos_lab` (`laboratorio_id`),
  CONSTRAINT `fk_laboratorio_contactos_lab` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: laboratorios
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `laboratorios`;
CREATE TABLE `laboratorios` (
  `id` char(36) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `codigo` varchar(40) DEFAULT NULL,
  `morada` text DEFAULT NULL,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `cidade` varchar(120) DEFAULT NULL,
  `distrito` varchar(120) DEFAULT NULL,
  `pais` varchar(80) DEFAULT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `notas` text DEFAULT NULL,
  `tipo` enum('operacional','final') NOT NULL DEFAULT 'operacional',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_laboratorios_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: lembretes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `lembretes`;
CREATE TABLE `lembretes` (
  `id` char(36) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `estado` enum('Pendente','Concluido') NOT NULL DEFAULT 'Pendente',
  `prioridade` enum('Baixa','Normal','Alta') NOT NULL DEFAULT 'Normal',
  `data_limite` date DEFAULT NULL,
  `paciente_id` char(36) DEFAULT NULL,
  `processo_id` char(36) DEFAULT NULL,
  `criado_por` char(36) DEFAULT NULL,
  `atribuido_a` char(36) DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_lembretes_estado` (`estado`),
  KEY `idx_lembretes_paciente` (`paciente_id`),
  KEY `idx_lembretes_processo` (`processo_id`),
  KEY `idx_lembretes_data` (`data_limite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: logs_auditoria
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `logs_auditoria`;
CREATE TABLE `logs_auditoria` (
  `id` char(36) NOT NULL,
  `empresa_id` char(36) DEFAULT NULL,
  `utilizador_id` char(36) DEFAULT NULL,
  `acao` varchar(100) DEFAULT NULL,
  `tabela_afetada` varchar(100) DEFAULT NULL,
  `registro_id` char(36) DEFAULT NULL,
  `data` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_log_empresa` (`empresa_id`),
  KEY `fk_log_utilizador` (`utilizador_id`),
  CONSTRAINT `fk_logs_empresas` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`),
  CONSTRAINT `fk_logs_utilizadores` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizadores` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: lotes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `lotes`;
CREATE TABLE `lotes` (
  `id` char(36) NOT NULL,
  `codigo_lote` varchar(50) NOT NULL,
  `tipo_kit_id` char(36) DEFAULT NULL,
  `data_rececao` timestamp NULL DEFAULT current_timestamp(),
  `quantidade` int(11) DEFAULT 0,
  `fornecedor_id` char(36) DEFAULT NULL,
  `validade` date DEFAULT NULL,
  `estado` varchar(30) DEFAULT 'Disponivel',
  `tipo_teste` varchar(80) DEFAULT NULL,
  `teste_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_lote` (`codigo_lote`),
  KEY `fk_lotes_fornecedor` (`fornecedor_id`),
  KEY `fk_lotes_teste` (`teste_id`),
  KEY `fk_lotes_tipo_kit` (`tipo_kit_id`),
  CONSTRAINT `fk_lotes_fornecedor` FOREIGN KEY (`fornecedor_id`) REFERENCES `empresas` (`id`),
  CONSTRAINT `fk_lotes_teste` FOREIGN KEY (`teste_id`) REFERENCES `testes` (`id`),
  CONSTRAINT `fk_lotes_tipo_kit` FOREIGN KEY (`tipo_kit_id`) REFERENCES `tipos_kit` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: medico_condicoes_testes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `medico_condicoes_testes`;
CREATE TABLE `medico_condicoes_testes` (
  `id` char(36) NOT NULL,
  `medico_id` char(36) NOT NULL,
  `teste_id` char(36) NOT NULL,
  `comissao` decimal(10,2) DEFAULT NULL,
  `prazo_pagamento_dias` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_medico_teste` (`medico_id`,`teste_id`),
  KEY `idx_medico_condicoes_medico` (`medico_id`),
  KEY `fk_medico_condicoes_teste` (`teste_id`),
  CONSTRAINT `fk_medico_condicoes_medico` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`utilizador_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_medico_condicoes_teste` FOREIGN KEY (`teste_id`) REFERENCES `testes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: medico_contactos_secundarios
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `medico_contactos_secundarios`;
CREATE TABLE `medico_contactos_secundarios` (
  `id` char(36) NOT NULL,
  `medico_id` char(36) NOT NULL,
  `ordem` tinyint(4) NOT NULL DEFAULT 1,
  `nome` varchar(120) DEFAULT NULL,
  `funcao` varchar(120) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_medico_contactos_medico` (`medico_id`),
  CONSTRAINT `fk_medico_contactos_medico` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`utilizador_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: medico_locais_trabalho
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `medico_locais_trabalho`;
CREATE TABLE `medico_locais_trabalho` (
  `id` char(36) NOT NULL,
  `medico_id` char(36) NOT NULL,
  `entidade_id` char(36) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_medico_locais_medico` (`medico_id`),
  KEY `idx_medico_locais_posto` (`entidade_id`),
  KEY `idx_medico_locais_entidade` (`entidade_id`),
  CONSTRAINT `fk_medico_locais_entidade` FOREIGN KEY (`entidade_id`) REFERENCES `entidades` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_medico_locais_medico` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`utilizador_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: medicos
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `medicos`;
CREATE TABLE `medicos` (
  `utilizador_id` char(36) NOT NULL,
  `num_ordem` varchar(30) DEFAULT NULL,
  `especialidade` varchar(100) DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `titulo` varchar(30) DEFAULT NULL,
  `genero` varchar(20) DEFAULT NULL,
  `pais` varchar(80) DEFAULT 'Portugal',
  `telefone_fixo` varchar(30) DEFAULT NULL,
  `criterio_busca_postos` varchar(40) DEFAULT 'nome',
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`utilizador_id`),
  UNIQUE KEY `num_ordem` (`num_ordem`),
  CONSTRAINT `fk_medicos_utilizadores` FOREIGN KEY (`utilizador_id`) REFERENCES `utilizadores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: motivos_anulacao
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `motivos_anulacao`;
CREATE TABLE `motivos_anulacao` (
  `id` char(36) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `contexto` varchar(20) NOT NULL DEFAULT 'contacto' COMMENT 'contacto | processo',
  `reabre_contacto` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Ao cancelar processo, repõe contacto para nova colheita',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_motivos_anulacao_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: movimentos_kits
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `movimentos_kits`;
CREATE TABLE `movimentos_kits` (
  `id` char(36) NOT NULL,
  `data` date NOT NULL,
  `kit_id` char(36) NOT NULL,
  `origem` enum('Escritorio','Posto','Laboratorio') NOT NULL,
  `destino` enum('Escritorio','Posto','Laboratorio') NOT NULL,
  `motivo` enum('Envio','Consumo','Reposicao','Transferencia','SMS Colheita','ReservaColheita','ConsumoColheita','EnvioLabFinal','CancelamentoReserva','ConfirmacaoLab','Descarte') NOT NULL,
  `observacoes` text DEFAULT NULL,
  `requisicao_id` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `origem_empresa_id` char(36) DEFAULT NULL,
  `origem_posto_id` char(36) DEFAULT NULL,
  `origem_laboratorio_id` char(36) DEFAULT NULL,
  `destino_empresa_id` char(36) DEFAULT NULL,
  `destino_posto_id` char(36) DEFAULT NULL,
  `destino_laboratorio_id` char(36) DEFAULT NULL,
  `processo_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_movimentos_kit` (`kit_id`),
  KEY `fk_movimentos_requisicao` (`requisicao_id`),
  CONSTRAINT `fk_movimentos_kit` FOREIGN KEY (`kit_id`) REFERENCES `kits` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movimentos_requisicao` FOREIGN KEY (`requisicao_id`) REFERENCES `requisicoes_kits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: notificacoes_lidas
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `notificacoes_lidas`;
CREATE TABLE `notificacoes_lidas` (
  `utilizador_id` char(36) NOT NULL,
  `notificacao_id` varchar(120) NOT NULL,
  `lida_em` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`utilizador_id`,`notificacao_id`),
  KEY `idx_notificacoes_lidas_utilizador` (`utilizador_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: pacientes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pacientes`;
CREATE TABLE `pacientes` (
  `id` char(36) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `data_nascimento` date DEFAULT NULL,
  `genero` varchar(20) DEFAULT NULL,
  `nif` varchar(20) DEFAULT NULL,
  `telemovel` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `morada` text DEFAULT NULL,
  `altura` decimal(5,2) DEFAULT NULL,
  `peso` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `ativo` tinyint(1) DEFAULT 1,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `pais` varchar(80) DEFAULT NULL,
  `distrito` varchar(80) DEFAULT NULL,
  `cidade` varchar(120) DEFAULT NULL,
  `medico_id` char(36) DEFAULT NULL,
  `teste_id` char(36) DEFAULT NULL,
  `tipo_gravidez` enum('singular','gemelar') DEFAULT NULL,
  `onde_seguida` varchar(200) DEFAULT NULL,
  `posto_colheita_id` char(36) DEFAULT NULL,
  `data_colheita_prevista` date DEFAULT NULL,
  `notas_internas` text DEFAULT NULL,
  `estado_agendamento` varchar(30) DEFAULT NULL COMMENT 'Agendado ou Kit Reservado (pre-processo)',
  `gestacao_semanas_registo` int(11) DEFAULT NULL COMMENT 'Semanas de gestação na data de registo',
  `gestacao_dias_registo` int(11) DEFAULT NULL COMMENT 'Dias de gestação na data de registo (0-6)',
  `gestacao_registada_em` date DEFAULT NULL COMMENT 'Data em que a gestação foi registada',
  `fatura_emitida` tinyint(1) DEFAULT 0,
  `fatura_numero` varchar(50) DEFAULT NULL,
  `fatura_data_emissao` date DEFAULT NULL,
  `valor_base` decimal(10,2) DEFAULT 0.00,
  `desconto_percentual` decimal(5,2) DEFAULT 0.00,
  `valor_final` decimal(10,2) DEFAULT 0.00,
  `pagamento_data` date DEFAULT NULL,
  `recibo_numero` varchar(50) DEFAULT NULL,
  `pago` tinyint(1) DEFAULT 0,
  `entidade_multibanco` varchar(20) DEFAULT NULL,
  `referencia_multibanco` varchar(20) DEFAULT NULL,
  `nao_gera_comissao` tinyint(1) DEFAULT 0,
  `fatura_envio_email` date DEFAULT NULL,
  `fatura_envio_sms` date DEFAULT NULL,
  `estado_contacto` varchar(20) DEFAULT NULL COMMENT 'Cancelado ou NULL',
  `motivo_anulacao_id` char(36) DEFAULT NULL,
  `data_anulacao` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nif` (`nif`),
  KEY `fk_pacientes_motivo_anulacao` (`motivo_anulacao_id`),
  CONSTRAINT `fk_pacientes_motivo_anulacao` FOREIGN KEY (`motivo_anulacao_id`) REFERENCES `motivos_anulacao` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: pedidos_exames
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `pedidos_exames`;
CREATE TABLE `pedidos_exames` (
  `id` char(36) NOT NULL,
  `paciente_id` char(36) NOT NULL,
  `medico_id` char(36) NOT NULL,
  `teste_id` char(36) NOT NULL,
  `empresa_id` char(36) NOT NULL,
  `data_pedido` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('Aguardando Colheita','Em Laboratorio','Em Analise','Concluido','Cancelado') DEFAULT 'Aguardando Colheita',
  `notas_clinicas` text DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fk_paciente` (`paciente_id`),
  KEY `fk_medico` (`medico_id`),
  KEY `fk_teste` (`teste_id`),
  KEY `fk_empresa` (`empresa_id`),
  CONSTRAINT `fk_pedidos_empresas` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`),
  CONSTRAINT `fk_pedidos_medicos` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`utilizador_id`),
  CONSTRAINT `fk_pedidos_pacientes` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  CONSTRAINT `fk_pedidos_testes` FOREIGN KEY (`teste_id`) REFERENCES `testes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: perfil_stock_submodulos
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `perfil_stock_submodulos`;
CREATE TABLE `perfil_stock_submodulos` (
  `perfil_id` char(36) NOT NULL,
  `submodulo` varchar(30) NOT NULL,
  `permitido` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`perfil_id`,`submodulo`),
  CONSTRAINT `fk_stock_submodulos_perfil` FOREIGN KEY (`perfil_id`) REFERENCES `perfis` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: perfis
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `perfis`;
CREATE TABLE `perfis` (
  `id` char(36) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: posto_condicoes_testes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `posto_condicoes_testes`;
CREATE TABLE `posto_condicoes_testes` (
  `id` char(36) NOT NULL,
  `posto_id` char(36) NOT NULL,
  `teste_id` char(36) NOT NULL,
  `comissao` decimal(10,2) DEFAULT NULL,
  `prazo_pagamento_dias` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_posto_teste` (`posto_id`,`teste_id`),
  KEY `idx_posto_condicoes_posto` (`posto_id`),
  KEY `fk_posto_condicoes_teste` (`teste_id`),
  CONSTRAINT `fk_posto_condicoes_posto` FOREIGN KEY (`posto_id`) REFERENCES `postos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_posto_condicoes_teste` FOREIGN KEY (`teste_id`) REFERENCES `testes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: posto_contactos_secundarios
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `posto_contactos_secundarios`;
CREATE TABLE `posto_contactos_secundarios` (
  `id` char(36) NOT NULL,
  `posto_id` char(36) NOT NULL,
  `ordem` tinyint(4) NOT NULL DEFAULT 1,
  `nome` varchar(120) DEFAULT NULL,
  `funcao` varchar(120) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `telefone` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_posto_contactos_posto` (`posto_id`),
  CONSTRAINT `fk_posto_contactos_posto` FOREIGN KEY (`posto_id`) REFERENCES `postos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: postos
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `postos`;
CREATE TABLE `postos` (
  `id` char(36) NOT NULL,
  `entidade_id` char(36) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `codigo_posto` varchar(20) DEFAULT NULL,
  `localizacao` text DEFAULT NULL,
  `morada` text DEFAULT NULL,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `cidade` varchar(120) DEFAULT NULL,
  `distrito` varchar(120) DEFAULT NULL,
  `pais` varchar(80) DEFAULT NULL,
  `contacto` varchar(100) DEFAULT NULL,
  `email` varchar(120) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `notas` text DEFAULT NULL,
  `laboratorio_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo_posto` (`codigo_posto`),
  KEY `fk_entidade` (`entidade_id`),
  KEY `idx_postos_laboratorio` (`laboratorio_id`),
  CONSTRAINT `fk_postos_empresas` FOREIGN KEY (`entidade_id`) REFERENCES `empresas` (`id`),
  CONSTRAINT `fk_postos_laboratorio` FOREIGN KEY (`laboratorio_id`) REFERENCES `laboratorios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: processo_relatorios
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `processo_relatorios`;
CREATE TABLE `processo_relatorios` (
  `id` char(36) NOT NULL,
  `processo_id` char(36) NOT NULL,
  `template` varchar(120) DEFAULT NULL,
  `pdf_url` text NOT NULL,
  `data_geracao` timestamp NULL DEFAULT current_timestamp(),
  `estado_envio` enum('Pendente','Enviado','Falha') DEFAULT 'Pendente',
  `observacoes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_relatorio_processo` (`processo_id`),
  CONSTRAINT `fk_relatorio_processos` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: processo_status
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `processo_status`;
CREATE TABLE `processo_status` (
  `nome` varchar(40) NOT NULL,
  `ordem` int(11) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: processos
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `processos`;
CREATE TABLE `processos` (
  `id` char(36) NOT NULL,
  `numero_processo` varchar(20) NOT NULL,
  `paciente_id` char(36) DEFAULT NULL,
  `medico_id` char(36) DEFAULT NULL,
  `posto_id` char(36) DEFAULT NULL,
  `kit_id` char(36) DEFAULT NULL,
  `status_id` varchar(30) DEFAULT NULL,
  `data_entrada` timestamp NULL DEFAULT current_timestamp(),
  `notas` text DEFAULT NULL,
  `teste_id` char(36) DEFAULT NULL,
  `empresa_id` char(36) DEFAULT NULL,
  `posto` varchar(120) DEFAULT NULL,
  `data_colheita` date DEFAULT NULL,
  `data_chegada_laboratorio` date DEFAULT NULL,
  `data_resultado` date DEFAULT NULL,
  `data_validacao` date DEFAULT NULL,
  `data_envio_relatorio` date DEFAULT NULL,
  `responsavel_fluxo` varchar(120) DEFAULT NULL,
  `relatorio_validado` tinyint(1) DEFAULT 0,
  `relatorio_enviado_para` varchar(20) DEFAULT 'Nenhum',
  `resultado_tudo_ok` tinyint(1) DEFAULT 1,
  `resultado_anomalias` text DEFAULT NULL,
  `fatura_emitida` tinyint(1) DEFAULT 0,
  `fatura_numero` varchar(50) DEFAULT NULL,
  `fatura_data_emissao` date DEFAULT NULL,
  `valor_base` decimal(10,2) DEFAULT 0.00,
  `desconto_percentual` decimal(5,2) DEFAULT 0.00,
  `valor_final` decimal(10,2) DEFAULT 0.00,
  `pagamento_data` date DEFAULT NULL,
  `recibo_numero` varchar(50) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `fracao_fetal` varchar(20) DEFAULT NULL,
  `pago` tinyint(1) DEFAULT 0,
  `data_colheita_prevista` date DEFAULT NULL COMMENT 'Data prevista de colheita (snapshot do contacto)',
  `laboratorio_final_id` char(36) DEFAULT NULL,
  `entidade_multibanco` varchar(20) DEFAULT NULL,
  `referencia_multibanco` varchar(20) DEFAULT NULL,
  `nao_gera_comissao` tinyint(1) DEFAULT 0,
  `fatura_envio_email` date DEFAULT NULL,
  `fatura_envio_sms` date DEFAULT NULL,
  `motivo_anulacao_id` char(36) DEFAULT NULL,
  `data_anulacao` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_processo` (`numero_processo`),
  UNIQUE KEY `uk_processos_numero` (`numero_processo`),
  UNIQUE KEY `uk_processos_kit` (`kit_id`),
  KEY `fk_processo_paciente` (`paciente_id`),
  KEY `fk_processo_medico` (`medico_id`),
  KEY `fk_processo_posto` (`posto_id`),
  KEY `fk_processo_kit` (`kit_id`),
  KEY `fk_processos_testes` (`teste_id`),
  KEY `fk_processos_empresas` (`empresa_id`),
  KEY `idx_processos_status` (`status_id`),
  KEY `idx_processos_data_entrada` (`data_entrada`),
  KEY `idx_processos_lab_final` (`laboratorio_final_id`),
  KEY `fk_processos_motivo_anulacao` (`motivo_anulacao_id`),
  CONSTRAINT `fk_processos_empresas` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`),
  CONSTRAINT `fk_processos_kits` FOREIGN KEY (`kit_id`) REFERENCES `kits` (`id`),
  CONSTRAINT `fk_processos_lab_final` FOREIGN KEY (`laboratorio_final_id`) REFERENCES `laboratorios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_processos_medicos` FOREIGN KEY (`medico_id`) REFERENCES `medicos` (`utilizador_id`),
  CONSTRAINT `fk_processos_motivo_anulacao` FOREIGN KEY (`motivo_anulacao_id`) REFERENCES `motivos_anulacao` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_processos_pacientes` FOREIGN KEY (`paciente_id`) REFERENCES `pacientes` (`id`),
  CONSTRAINT `fk_processos_postos` FOREIGN KEY (`posto_id`) REFERENCES `postos` (`id`),
  CONSTRAINT `fk_processos_status` FOREIGN KEY (`status_id`) REFERENCES `processo_status` (`nome`),
  CONSTRAINT `fk_processos_testes` FOREIGN KEY (`teste_id`) REFERENCES `testes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: requisicao_kits_itens
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `requisicao_kits_itens`;
CREATE TABLE `requisicao_kits_itens` (
  `id` char(36) NOT NULL,
  `requisicao_id` char(36) NOT NULL,
  `kit_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_requisicao_kit` (`requisicao_id`,`kit_id`),
  KEY `fk_requisicao` (`requisicao_id`),
  KEY `fk_kit` (`kit_id`),
  CONSTRAINT `fk_requisicao_itens_kit` FOREIGN KEY (`kit_id`) REFERENCES `kits` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_requisicao_itens_requisicao` FOREIGN KEY (`requisicao_id`) REFERENCES `requisicoes_kits` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: requisicoes_kits
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `requisicoes_kits`;
CREATE TABLE `requisicoes_kits` (
  `id` char(36) NOT NULL,
  `numero_envio` varchar(50) DEFAULT NULL,
  `utilizador_id` char(36) DEFAULT NULL,
  `data` date NOT NULL,
  `origem` enum('Escritorio','Posto','Laboratorio') NOT NULL,
  `destino` enum('Escritorio','Posto','Laboratorio') NOT NULL,
  `quantidade` int(11) NOT NULL,
  `status` enum('Pendente','Em transito','Entregue','Cancelada') DEFAULT 'Pendente',
  `tracking_number` varchar(100) DEFAULT NULL,
  `transportadora` varchar(100) DEFAULT NULL,
  `lote_id` char(36) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `origem_empresa_id` char(36) DEFAULT NULL,
  `origem_posto_id` char(36) DEFAULT NULL,
  `origem_laboratorio_id` char(36) DEFAULT NULL,
  `destino_empresa_id` char(36) DEFAULT NULL,
  `destino_posto_id` char(36) DEFAULT NULL,
  `destino_laboratorio_id` char(36) DEFAULT NULL,
  `origem_nome` varchar(120) DEFAULT NULL,
  `destino_nome` varchar(120) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_requisicoes_numero_envio` (`numero_envio`),
  KEY `fk_requisicoes_lote` (`lote_id`),
  CONSTRAINT `fk_requisicoes_lote` FOREIGN KEY (`lote_id`) REFERENCES `lotes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: resultados_detalhados
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `resultados_detalhados`;
CREATE TABLE `resultados_detalhados` (
  `id` char(36) NOT NULL,
  `pedido_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  `resultado` varchar(100) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `data_resultado` timestamp NULL DEFAULT current_timestamp(),
  `ativo` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `fk_pedido` (`pedido_id`),
  KEY `fk_item` (`item_id`),
  CONSTRAINT `fk_resultados_itens` FOREIGN KEY (`item_id`) REFERENCES `itens_pesquisa` (`id`),
  CONSTRAINT `fk_resultados_pedidos` FOREIGN KEY (`pedido_id`) REFERENCES `pedidos_exames` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: resultados_geneticos
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `resultados_geneticos`;
CREATE TABLE `resultados_geneticos` (
  `id` char(36) NOT NULL,
  `processo_id` char(36) DEFAULT NULL,
  `cromossoma` varchar(10) DEFAULT NULL,
  `resultado_valor` varchar(50) DEFAULT NULL,
  `probabilidade` varchar(50) DEFAULT NULL,
  `tipo_resultado` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_resultado_processo` (`processo_id`),
  CONSTRAINT `fk_resultados_geneticos_processos` FOREIGN KEY (`processo_id`) REFERENCES `processos` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: teste_composicao
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `teste_composicao`;
CREATE TABLE `teste_composicao` (
  `teste_id` char(36) NOT NULL,
  `item_id` char(36) NOT NULL,
  PRIMARY KEY (`teste_id`,`item_id`),
  KEY `fk_teste_composicao_itens` (`item_id`),
  CONSTRAINT `fk_teste_composicao_itens` FOREIGN KEY (`item_id`) REFERENCES `itens_pesquisa` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teste_composicao_testes` FOREIGN KEY (`teste_id`) REFERENCES `testes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: testes
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `testes`;
CREATE TABLE `testes` (
  `id` char(36) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `preco` decimal(10,2) NOT NULL DEFAULT 0.00,
  `descricao` text DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `codigo` varchar(20) DEFAULT NULL,
  `categoria` varchar(80) DEFAULT NULL,
  `laboratorio_id` char(36) DEFAULT NULL,
  `tempo_estimado` int(11) DEFAULT NULL,
  `preco_compra` decimal(10,2) DEFAULT 0.00,
  `preco_venda` decimal(10,2) DEFAULT 0.00,
  `tempo_resposta_dias` int(11) DEFAULT NULL,
  `gestacao_minima_semanas` int(11) DEFAULT NULL,
  `tipo_teste` varchar(80) DEFAULT NULL,
  `empresa` varchar(80) DEFAULT NULL,
  `tipo_kit` varchar(80) DEFAULT NULL,
  `cromossomas` text DEFAULT NULL,
  `delecoes_duplicacoes` tinyint(1) DEFAULT 0,
  `microdelecoes_microduplicacoes` tinyint(1) DEFAULT 0,
  `gemeos` tinyint(1) DEFAULT 0,
  `incluir_fracao_fetal` tinyint(1) DEFAULT 1,
  `laboratorio_processamento_id` char(36) DEFAULT NULL,
  `determinacao_sexo_fetal` tinyint(1) NOT NULL DEFAULT 0,
  `teste_pai_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_testes_laboratorio` (`laboratorio_id`),
  KEY `idx_testes_lab_proc` (`laboratorio_processamento_id`),
  KEY `fk_testes_pai` (`teste_pai_id`),
  CONSTRAINT `fk_testes_lab_proc` FOREIGN KEY (`laboratorio_processamento_id`) REFERENCES `laboratorios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_testes_laboratorio` FOREIGN KEY (`laboratorio_id`) REFERENCES `empresas` (`id`),
  CONSTRAINT `fk_testes_pai` FOREIGN KEY (`teste_pai_id`) REFERENCES `testes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: tipos_kit
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `tipos_kit`;
CREATE TABLE `tipos_kit` (
  `id` char(36) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tipos_kit_nome` (`nome`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Estrutura: utilizadores
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `utilizadores`;
CREATE TABLE `utilizadores` (
  `id` char(36) NOT NULL,
  `perfil_id` char(36) DEFAULT NULL,
  `empresa_id` char(36) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `password_hash` text DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `reset_token_hash` varchar(128) DEFAULT NULL,
  `reset_token_expires_at` datetime DEFAULT NULL,
  `avatar_url` mediumtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_perfil` (`perfil_id`),
  KEY `fk_empresa` (`empresa_id`),
  CONSTRAINT `fk_utilizadores_empresas` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_utilizadores_perfis` FOREIGN KEY (`perfil_id`) REFERENCES `perfis` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados: colheitas (1 registos)
INSERT INTO `colheitas` (`id`, `processo_id`, `posto_id`, `data_prevista`, `periodo`, `data_efetiva`, `created_at`) VALUES
('cab57437-a399-4401-95f6-98d5609053b5', '6c775e84-2fbc-4856-92ea-51f32b11db48', '28669dab-7ffe-4ae2-8aca-64ae52d19422', '2026-06-26 23:00:00', NULL, '2026-06-26 23:00:00', '2026-06-26 23:18:15');


-- Dados: empresas (1 registos)
INSERT INTO `empresas` (`id`, `nome`, `morada`, `codigo_postal`, `telefone`, `email`, `created_at`, `ativo`, `tipo_empresa`, `nif`, `pais`, `contacto`) VALUES
('5c7356ae-cdde-4e06-b473-da17686e8daa', 'Genoma', 'Praça Mouzinho de Albuquerque, 113 - 5º', '4100-359', '+351 918768897', 'genomabusiness@genoma.pt', '2026-06-26 22:47:57', 1, 'CLINICA', '510987672', 'Portugal', 'Rafael Males');


-- Dados: entidade_condicoes_testes (20 registos)
INSERT INTO `entidade_condicoes_testes` (`id`, `entidade_id`, `teste_id`, `comissao`, `prazo_pagamento_dias`) VALUES
('024a52ff-632e-4981-93d6-9d232488633b', '950408c3-44c9-4894-bddf-5b221e75c626', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '5.00', 30),
('154b531e-e466-4c83-9c05-4adffd6c378c', '6b4d7024-780d-4b3a-b552-2b692ca1f3cf', 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '5.00', 45),
('15f40f18-d158-4289-bc03-02f66b9f8897', '41a9e613-e851-4a33-8f80-254a6f326e79', 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '8.00', 45),
('1db79b9c-bae6-4f4a-a997-30742aa716a5', '453fcc12-702f-4008-8a42-6d828c0f1bcf', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '5.00', 30),
('25db658c-c564-433f-9c0c-785f79c77daa', '902a7039-f3ec-44a3-895c-47ec041a356b', 'd25417d9-1bac-4076-b2c5-cb913287900f', '7.00', 60),
('2d4c5c0f-911f-47b3-b02b-53f6964f3af9', 'c6836cc1-1e2f-4264-a065-a80094b9db6f', 'd25417d9-1bac-4076-b2c5-cb913287900f', '5.00', 60),
('44ed559a-a716-46a6-8625-c58db7ab024d', '251cfd47-aa76-4b32-85da-73e21ce85efe', 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '6.00', 45),
('48cd8758-f5b2-47a0-809c-e7a46ad5fdac', '746a5718-37ce-4505-8d66-f3bbc55950a8', 'd25417d9-1bac-4076-b2c5-cb913287900f', '9.00', 60),
('71429cee-1234-4fd4-b91c-535fa2447022', '54815c75-b8b4-466c-920f-4e9e57984133', 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '6.00', 45),
('725fcec0-5618-427c-95b1-d40da090676b', '98cd01af-4e28-4d7a-93e6-bf17b0ad1b62', 'd25417d9-1bac-4076-b2c5-cb913287900f', '8.00', 60),
('835645fd-550e-4e23-8d2e-d84f6dccc0aa', '02784d4f-f584-487a-8f42-3477fff68ce5', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '8.00', 30),
('9db8a6c0-45fb-408f-b624-3ff769c6ca77', '7bad509b-538e-4a57-a6ad-14a3426f1ad9', 'd25417d9-1bac-4076-b2c5-cb913287900f', '7.00', 60),
('a4c59e5b-ef04-4a1f-a9db-a37195105aa7', 'a2a495dc-a960-48f5-9431-fea76aedcb42', 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '7.00', 45),
('afcb303e-c2a3-41b5-a4b1-39631b22a729', '743d7761-aa37-406f-9593-676a33a40609', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '6.00', 30),
('c4e0ec0a-3823-4864-8b2a-af2ae7f4a84d', '4f39e105-5c74-4a34-8b23-8113497c925f', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '7.00', 30),
('c81c240b-11f5-4d21-893c-1b35446fd7c7', '2aa5fecb-b00b-47e1-8ef6-6c89d2f295aa', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '9.00', 30),
('cd7a33e8-cd00-4d00-81af-e079ebc12503', 'd263604e-5810-4be9-b0be-2481f4ab19bd', 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '9.00', 45),
('d7594b0b-2e9d-4eba-842a-0fe7f45fb258', '776de444-8ea9-4cda-bfb1-066f56da5042', 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '9.00', 45),
('d786beee-3a43-4cd2-a71a-037518cd92f5', '79030b88-f50a-4003-9b94-18bf75544f83', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '8.00', 30),
('f0783290-b381-49ce-aded-be9e515a8233', 'f1d386b3-53e9-42a6-817b-69beecf3d042', 'd25417d9-1bac-4076-b2c5-cb913287900f', '6.00', 60);


-- Dados: entidade_contactos_secundarios (40 registos)
INSERT INTO `entidade_contactos_secundarios` (`id`, `entidade_id`, `ordem`, `nome`, `funcao`, `email`, `telefone`) VALUES
('16b38b2d-e010-4b04-989c-176f0341188b', '902a7039-f3ec-44a3-895c-47ec041a356b', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hdl-mat@clinica.pt', '+351 21 200017'),
('1b5d3398-a8de-4fc2-a823-6299efb55675', '6b4d7024-780d-4b3a-b552-2b692ca1f3cf', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hcf-pto@clinica.pt', '+351 21 200010'),
('204154f0-b670-4c41-ad89-04e76ade936b', 'c6836cc1-1e2f-4264-a065-a80094b9db6f', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.csj-001@clinica.pt', '+351 21 200005'),
('22dd0353-ba5c-4de2-a2bc-2f8054eed625', '79030b88-f50a-4003-9b94-18bf75544f83', 1, 'Receção Porto', 'Receção', 'rececao.clu-pto@clinica.pt', '+351 21 100003'),
('2dfb6419-82ea-4c81-bfe1-239a10ed7c6a', '2aa5fecb-b00b-47e1-8ef6-6c89d2f295aa', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.cts-pto@clinica.pt', '+351 21 200009'),
('32300a67-0f8d-4b0d-98c6-c33f442ee659', '453fcc12-702f-4008-8a42-6d828c0f1bcf', 1, 'Receção Oeiras', 'Receção', 'rececao.hdl-oei@clinica.pt', '+351 21 100015'),
('33d5e552-3d5b-4a11-8b06-b7f03ec16201', 'd263604e-5810-4be9-b0be-2481f4ab19bd', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.cmi-lis@clinica.pt', '+351 21 200004'),
('3572ca28-1e32-4aa9-a179-e499f8812c00', '902a7039-f3ec-44a3-895c-47ec041a356b', 1, 'Receção Matosinhos', 'Receção', 'rececao.hdl-mat@clinica.pt', '+351 21 100017'),
('363d5802-5894-496f-8154-a9e9d43c72ac', '251cfd47-aa76-4b32-85da-73e21ce85efe', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hdl-lis@clinica.pt', '+351 21 200016'),
('475985ca-6697-4b32-9e8f-565b8f9a4762', '6b4d7024-780d-4b3a-b552-2b692ca1f3cf', 1, 'Receção Porto', 'Receção', 'rececao.hcf-pto@clinica.pt', '+351 21 100010'),
('4c625c99-e9f7-45dc-82c9-86133d8f4b12', '41a9e613-e851-4a33-8f80-254a6f326e79', 1, 'Receção Amadora', 'Receção', 'rececao.hdl-ama@clinica.pt', '+351 21 100013'),
('4d815e93-6e7f-4e02-9002-2fee5c99e33c', '41a9e613-e851-4a33-8f80-254a6f326e79', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hdl-ama@clinica.pt', '+351 21 200013'),
('508abe42-1f7c-48b4-81fa-2ee8e898ee40', 'a2a495dc-a960-48f5-9431-fea76aedcb42', 1, 'Receção Gaia', 'Receção', 'rececao.cts-gai@clinica.pt', '+351 21 100007'),
('5c5c105d-7f56-48fb-9f56-7a4062b6ccba', '776de444-8ea9-4cda-bfb1-066f56da5042', 1, 'Receção Porto', 'Receção', 'rececao.hlu-pto@clinica.pt', '+351 21 100019'),
('5e954f05-eeb6-4247-9cdf-af65082013de', '79030b88-f50a-4003-9b94-18bf75544f83', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.clu-pto@clinica.pt', '+351 21 200003'),
('66139e4c-11af-4e15-8b2c-206134c00aa9', '746a5718-37ce-4505-8d66-f3bbc55950a8', 1, 'Receção Arrábida', 'Receção', 'rececao.hdl-arr@clinica.pt', '+351 21 100014'),
('669a3252-183a-4079-b330-62c3ca5ec95b', '776de444-8ea9-4cda-bfb1-066f56da5042', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hlu-pto@clinica.pt', '+351 21 200019'),
('709a0244-8cfc-4eec-ba0a-68874e63aa90', '4f39e105-5c74-4a34-8b23-8113497c925f', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hcf-vis@clinica.pt', '+351 21 200012'),
('7b72d909-414d-4022-ab1d-abccc803ec9b', '02784d4f-f584-487a-8f42-3477fff68ce5', 1, 'Receção Lisboa', 'Receção', 'rececao.hlu-lis@clinica.pt', '+351 21 100018'),
('7e8497c3-176d-462f-98a2-6ceffa1502b9', '2aa5fecb-b00b-47e1-8ef6-6c89d2f295aa', 1, 'Receção Porto', 'Receção', 'rececao.cts-pto@clinica.pt', '+351 21 100009'),
('7ef33ceb-5621-4bac-8edb-b9252aa30139', '743d7761-aa37-406f-9593-676a33a40609', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.cts-bra@clinica.pt', '+351 21 200006'),
('7f747837-5549-41a7-896b-89a907777aac', '54815c75-b8b4-466c-920f-4e9e57984133', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.ccf-tej@clinica.pt', '+351 21 200001'),
('88a72cdf-7021-4dad-a259-3f22812007e7', 'f1d386b3-53e9-42a6-817b-69beecf3d042', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hcf-tej@clinica.pt', '+351 21 200011'),
('8a4feda6-49f0-4bb6-b263-7422ad6cc6de', '4f39e105-5c74-4a34-8b23-8113497c925f', 1, 'Receção Viseu', 'Receção', 'rececao.hcf-vis@clinica.pt', '+351 21 100012'),
('8d60d7d6-70bd-4a6c-9223-3379bf0b4c25', '02784d4f-f584-487a-8f42-3477fff68ce5', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hlu-lis@clinica.pt', '+351 21 200018'),
('9b8c16b6-2872-44f3-be57-5c070e1e7441', 'f1d386b3-53e9-42a6-817b-69beecf3d042', 1, 'Receção Tejo', 'Receção', 'rececao.hcf-tej@clinica.pt', '+351 21 100011'),
('a988b177-30ba-4923-ab88-975fe252cce8', '950408c3-44c9-4894-bddf-5b221e75c626', 1, 'Receção Porto', 'Receção', 'rececao.ccf-pto@clinica.pt', '+351 21 100000'),
('b9b2ffe3-6bdc-4462-9918-70858e354f81', 'd263604e-5810-4be9-b0be-2481f4ab19bd', 1, 'Receção Lisboa', 'Receção', 'rececao.cmi-lis@clinica.pt', '+351 21 100004'),
('be69116b-8fa5-4085-b1b8-36914ad25376', '7bad509b-538e-4a57-a6ad-14a3426f1ad9', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.clu-lis@clinica.pt', '+351 21 200002'),
('c1d9d080-1310-4ea2-84e0-70bddc3c1b6e', 'a2a495dc-a960-48f5-9431-fea76aedcb42', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.cts-gai@clinica.pt', '+351 21 200007'),
('cd5ff67d-fb4a-4eb7-86b6-e9388c41ec9c', '98cd01af-4e28-4d7a-93e6-bf17b0ad1b62', 1, 'Receção Maia', 'Receção', 'rececao.cts-mai@clinica.pt', '+351 21 100008'),
('d4ac5b56-d740-4aa0-9388-38fc6759b8cd', '251cfd47-aa76-4b32-85da-73e21ce85efe', 1, 'Receção Lisboa', 'Receção', 'rececao.hdl-lis@clinica.pt', '+351 21 100016'),
('d9328311-017c-4b19-b040-637997f25317', '743d7761-aa37-406f-9593-676a33a40609', 1, 'Receção Braga', 'Receção', 'rececao.cts-bra@clinica.pt', '+351 21 100006'),
('e03a2f3d-276a-493f-9cf8-d6af886a2964', '7bad509b-538e-4a57-a6ad-14a3426f1ad9', 1, 'Receção Lisboa', 'Receção', 'rececao.clu-lis@clinica.pt', '+351 21 100002'),
('ef23b7e0-0879-48c5-8f70-27c93ab22dbd', '746a5718-37ce-4505-8d66-f3bbc55950a8', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hdl-arr@clinica.pt', '+351 21 200014'),
('f00dcf9c-6162-4bba-b43a-f5be505e0584', '453fcc12-702f-4008-8a42-6d828c0f1bcf', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.hdl-oei@clinica.pt', '+351 21 200015'),
('f2e0273a-5276-486f-860d-b071149377bb', 'c6836cc1-1e2f-4264-a065-a80094b9db6f', 1, 'Receção Deus', 'Receção', 'rececao.csj-001@clinica.pt', '+351 21 100005'),
('f79311b1-b4fc-4243-93b9-afcdb031e6fb', '54815c75-b8b4-466c-920f-4e9e57984133', 1, 'Receção Tejo', 'Receção', 'rececao.ccf-tej@clinica.pt', '+351 21 100001'),
('f9bfd091-0cd6-452c-b704-8dfa571fba45', '98cd01af-4e28-4d7a-93e6-bf17b0ad1b62', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.cts-mai@clinica.pt', '+351 21 200008'),
('fdb40d0a-77b5-4dbe-a7a9-e15cbb21495d', '950408c3-44c9-4894-bddf-5b221e75c626', 2, 'Coordenação Obstétrica', 'Coordenação', 'obstetricia.ccf-pto@clinica.pt', '+351 21 200000');


-- Dados: entidades (20 registos)
INSERT INTO `entidades` (`id`, `nome`, `codigo`, `morada`, `codigo_postal`, `cidade`, `distrito`, `pais`, `contacto`, `email`, `notas`, `ativo`, `created_at`, `updated_at`) VALUES
('02784d4f-f584-487a-8f42-3477fff68ce5', 'Hospital Lusíadas Lisboa', 'ENT-HLU-LIS', 'Av. Lusíada, 100', '1600-706', 'Lisboa', 'Lisboa', 'Portugal', '+351 210000018', 'contacto.hlu-lis@clinica.pt', 'Entidade de referência — Hospital Lusíadas Lisboa.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('251cfd47-aa76-4b32-85da-73e21ce85efe', 'Hospital da Luz Lisboa', 'ENT-HDL-LIS', 'Av. Lusíada, 100', '1600-706', 'Lisboa', 'Lisboa', 'Portugal', '+351 210000016', 'contacto.hdl-lis@clinica.pt', 'Entidade de referência — Hospital da Luz Lisboa.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('2aa5fecb-b00b-47e1-8ef6-6c89d2f295aa', 'Clínica Trofa Saúde Porto', 'ENT-CTS-PTO', 'Rua de Costa Cabral, 950', '4200-135', 'Porto', 'Porto', 'Portugal', '+351 210000009', 'contacto.cts-pto@clinica.pt', 'Entidade de referência — Clínica Trofa Saúde Porto.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('41a9e613-e851-4a33-8f80-254a6f326e79', 'Hospital da Luz Amadora', 'ENT-HDL-AMA', 'Av. Comendador Fernando Cabral, 1', '2700-500', 'Amadora', 'Lisboa', 'Portugal', '+351 210000013', 'contacto.hdl-ama@clinica.pt', 'Entidade de referência — Hospital da Luz Amadora.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('453fcc12-702f-4008-8a42-6d828c0f1bcf', 'Hospital da Luz Clínica de Oeiras', 'ENT-HDL-OEI', 'Rua da Misericórdia, 2', '2780-272', 'Oeiras', 'Lisboa', 'Portugal', '+351 210000015', 'contacto.hdl-oei@clinica.pt', 'Entidade de referência — Hospital da Luz Clínica de Oeiras.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('4f39e105-5c74-4a34-8b23-8113497c925f', 'Hospital CUF Viseu', 'ENT-HCF-VIS', 'Av. da Beira Alta, 2', '3504-509', 'Viseu', 'Viseu', 'Portugal', '+351 210000012', 'contacto.hcf-vis@clinica.pt', 'Entidade de referência — Hospital CUF Viseu.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('54815c75-b8b4-466c-920f-4e9e57984133', 'Clínica CUF Tejo', 'ENT-CCF-TEJ', 'Rua da Piscina, 36', '1998-018', 'Lisboa', 'Lisboa', 'Portugal', '+351 210000001', 'contacto.ccf-tej@clinica.pt', 'Entidade de referência — Clínica CUF Tejo.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('6b4d7024-780d-4b3a-b552-2b692ca1f3cf', 'Hospital CUF Porto', 'ENT-HCF-PTO', 'Rua Marquês de Pombal, 145', '4100-180', 'Porto', 'Porto', 'Portugal', '+351 210000010', 'contacto.hcf-pto@clinica.pt', 'Entidade de referência — Hospital CUF Porto.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('743d7761-aa37-406f-9593-676a33a40609', 'Clínica Trofa Saúde Braga', 'ENT-CTS-BRA', 'Av. da Liberdade, 1230', '4710-427', 'Braga', 'Braga', 'Portugal', '+351 210000006', 'contacto.cts-bra@clinica.pt', 'Entidade de referência — Clínica Trofa Saúde Braga.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('746a5718-37ce-4505-8d66-f3bbc55950a8', 'Hospital da Luz Arrábida', 'ENT-HDL-ARR', 'Rua Manuel de Arriaga, 16', '2900-616', 'Setúbal', 'Setúbal', 'Portugal', '+351 210000014', 'contacto.hdl-arr@clinica.pt', 'Entidade de referência — Hospital da Luz Arrábida.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('776de444-8ea9-4cda-bfb1-066f56da5042', 'Hospital Lusíadas Porto', 'ENT-HLU-PTO', 'Rua de D. Manuel II, 291', '4150-338', 'Porto', 'Porto', 'Portugal', '+351 210000019', 'contacto.hlu-pto@clinica.pt', 'Entidade de referência — Hospital Lusíadas Porto.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('79030b88-f50a-4003-9b94-18bf75544f83', 'Clínica Lusíadas Porto', 'ENT-CLU-PTO', 'Rua de D. Manuel II, 291', '4150-338', 'Porto', 'Porto', 'Portugal', '+351 210000003', 'contacto.clu-pto@clinica.pt', 'Entidade de referência — Clínica Lusíadas Porto.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('7bad509b-538e-4a57-a6ad-14a3426f1ad9', 'Clínica Lusíadas Lisboa', 'ENT-CLU-LIS', 'Av. Lusíada, 100', '1600-706', 'Lisboa', 'Lisboa', 'Portugal', '+351 210000002', 'contacto.clu-lis@clinica.pt', 'Entidade de referência — Clínica Lusíadas Lisboa.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('902a7039-f3ec-44a3-895c-47ec041a356b', 'Hospital da Luz Matosinhos', 'ENT-HDL-MAT', 'Rua de Brito Capelo, 275', '4450-124', 'Matosinhos', 'Porto', 'Portugal', '+351 210000017', 'contacto.hdl-mat@clinica.pt', 'Entidade de referência — Hospital da Luz Matosinhos.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('950408c3-44c9-4894-bddf-5b221e75c626', 'Clínica CUF Porto', 'ENT-CCF-PTO', 'Rua Marquês de Pombal, 145', '4100-180', 'Porto', 'Porto', 'Portugal', '+351 210000000', 'contacto.ccf-pto@clinica.pt', 'Entidade de referência — Clínica CUF Porto.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('98cd01af-4e28-4d7a-93e6-bf17b0ad1b62', 'Clínica Trofa Saúde Maia', 'ENT-CTS-MAI', 'Rua da Praia, 100', '4470-575', 'Maia', 'Porto', 'Portugal', '+351 210000008', 'contacto.cts-mai@clinica.pt', 'Entidade de referência — Clínica Trofa Saúde Maia.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('a2a495dc-a960-48f5-9431-fea76aedcb42', 'Clínica Trofa Saúde Gaia', 'ENT-CTS-GAI', 'Rua de Camões, 1078', '4400-346', 'Vila Nova de Gaia', 'Porto', 'Portugal', '+351 210000007', 'contacto.cts-gai@clinica.pt', 'Entidade de referência — Clínica Trofa Saúde Gaia.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('c6836cc1-1e2f-4264-a065-a80094b9db6f', 'Clínica São João de Deus', 'ENT-CSJ-001', 'Rua de São João de Deus, 9', '1200-837', 'Lisboa', 'Lisboa', 'Portugal', '+351 210000005', 'contacto.csj-001@clinica.pt', 'Entidade de referência — Clínica São João de Deus.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('d263604e-5810-4be9-b0be-2481f4ab19bd', 'Clínica Médica Internacional de Lisboa', 'ENT-CMI-LIS', 'Av. Duque de Loulé, 12', '1400-204', 'Lisboa', 'Lisboa', 'Portugal', '+351 210000004', 'contacto.cmi-lis@clinica.pt', 'Entidade de referência — Clínica Médica Internacional de Lisboa.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57'),
('f1d386b3-53e9-42a6-817b-69beecf3d042', 'Hospital CUF Tejo', 'ENT-HCF-TEJ', 'Rua da Piscina, 36', '1998-018', 'Lisboa', 'Lisboa', 'Portugal', '+351 210000011', 'contacto.hcf-tej@clinica.pt', 'Entidade de referência — Hospital CUF Tejo.', 1, '2026-06-26 22:47:57', '2026-06-26 22:47:57');


-- Dados: informacao_clinica (1 registos)
INSERT INTO `informacao_clinica` (`id`, `processo_id`, `semanas_gravidez`, `dias_gravidez`, `tipo_gravidez`, `quer_saber_sexo`, `motivo_prescricao`, `data_registo`, `gestacao_registada_em`) VALUES
('41e4019b-5464-4ece-9f7f-645358adf0db', '6c775e84-2fbc-4856-92ea-51f32b11db48', NULL, NULL, 'singular', 0, 'Clínica CUF Porto', '2026-06-26 23:18:15', NULL);


-- Dados: kits (34 registos)
INSERT INTO `kits` (`id`, `numero_kit`, `tracking`, `codigo_barras`, `tipo_kit_id`, `lote_id`, `empresa_id`, `posto_id`, `status`, `data_validade`, `localizacao`, `fase_ciclo`, `laboratorio_id`) VALUES
('099590bd-e502-4ce5-96bf-3bc3f8a931a0', 'NPT5914597', 'NPT5914597', 'NPT5914597', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('0ba4b051-4218-4c07-961b-a15e7bebc5c7', 'NPT5914605', 'NPT5914605', 'NPT5914605', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('0dd580c5-f946-495c-81ca-4197425e80d9', 'NPT5914582', 'NPT5914582', 'NPT5914582', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('1f09d2d6-f3a3-41d9-91eb-4b1b3f526762', 'NPT5914603', 'NPT5914603', 'NPT5914603', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('27943e0b-e2e6-4a32-9555-73f1b08fef09', 'NPT5914604', 'NPT5914604', 'NPT5914604', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('2b17ef55-dbc2-4b94-a9a4-c5eeaa237bed', 'NPT5914577', 'NPT5914577', 'NPT5914577', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('3408f2bd-5739-459f-89df-8c148f12c7b8', 'NPT5914573', 'NPT5914573', 'NPT5914573', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('4bfa45b8-87ce-4430-8c6d-6287c2ce5b2a', 'NPT5914578', 'NPT5914578', 'NPT5914578', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('631a13a6-3c4f-40d3-80f0-6f20970f14d0', 'NPT5914606', 'NPT5914606', 'NPT5914606', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('6a0d4fa3-b8f5-4c91-b5a9-a47bcebb2c29', 'NPT5914599', 'NPT5914599', 'NPT5914599', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '5f1a666c-007d-463a-a693-556a3cfd1001', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('82231c1b-2664-4d90-b531-55c3750ec3c9', 'NPT5914591', 'NPT5914591', 'NPT5914591', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, 'df9b1034-ba18-45cc-958c-50a546868ff7', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('85b2c590-22c7-494d-940a-9aa1c7251e19', 'NPT5914601', 'NPT5914601', 'NPT5914601', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('87d3eb37-8729-459a-a6aa-f96f1912155e', 'NPT5914584', 'NPT5914584', 'NPT5914584', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('8b24c84b-5213-4e47-85cb-7a8fc7b5be63', 'NPT5914574', 'NPT5914574', 'NPT5914574', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('8c10e0be-c624-428b-af67-e50831e6a2c0', 'NPT5914592', 'NPT5914592', 'NPT5914592', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '81bfb463-cd12-449a-8a89-3e4e30e4672c', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('8ee53ee0-442f-4ed5-9a2b-c98ab5ab6c71', 'NPT5914595', 'NPT5914595', 'NPT5914595', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('94e65552-3814-4fe6-9e91-98f616bd8189', 'NPT5914581', 'NPT5914581', 'NPT5914581', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('9542160a-4023-4583-b05b-9f55e1dd0f81', 'NPT5914585', 'NPT5914585', 'NPT5914585', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('983d8416-5441-401a-8b02-4b1d39c6599c', 'NPT5914602', 'NPT5914602', 'NPT5914602', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('a316d0d4-b60e-4612-bbd2-4c6f053a37c5', 'NPT5914588', 'NPT5914588', 'NPT5914588', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '28669dab-7ffe-4ae2-8aca-64ae52d19422', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('a34d3dc7-a4e0-491b-a18a-122bbdafcc30', 'NPT5914576', 'NPT5914576', 'NPT5914576', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('a4f671a2-1b6f-4f60-bd61-dfa3a9b1c359', 'NPT5914579', 'NPT5914579', 'NPT5914579', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('a724d977-d4a4-434e-b54f-8ac8fda74ef7', 'NPT5914587', 'NPT5914587', 'NPT5914587', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '28669dab-7ffe-4ae2-8aca-64ae52d19422', 'Utilizado', '2027-06-29 23:00:00', 'Posto', 'aguarda_envio_lab', NULL),
('ab605b04-ccc6-4b6f-9d39-1103026bc02c', 'NPT5914583', 'NPT5914583', 'NPT5914583', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('c1c4f322-2083-4283-bbb5-6aa720c7bd48', 'NPT5914590', 'NPT5914590', 'NPT5914590', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, 'df9b1034-ba18-45cc-958c-50a546868ff7', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('c1f72f81-0eed-4038-a5cc-44a9a48f9c5d', 'NPT5914594', 'NPT5914594', 'NPT5914594', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '81bfb463-cd12-449a-8a89-3e4e30e4672c', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('c275c49e-8b67-44cb-9b82-cfa3d3a0e1b3', 'NPT5914580', 'NPT5914580', 'NPT5914580', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('c30bb25f-ff6c-428f-bd2f-59e7a67ef0f1', 'NPT5914598', 'NPT5914598', 'NPT5914598', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '5f1a666c-007d-463a-a693-556a3cfd1001', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('c8b34515-a1c5-49a3-94d4-bbf32469b924', 'NPT5914589', 'NPT5914589', 'NPT5914589', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, 'df9b1034-ba18-45cc-958c-50a546868ff7', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('dd64e60f-b5fa-4457-b27b-0fc7f56f079e', 'NPT5914600', 'NPT5914600', 'NPT5914600', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '5f1a666c-007d-463a-a693-556a3cfd1001', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('e33d9b9d-ba2e-42d9-8021-e4a120aed876', 'NPT5914593', 'NPT5914593', 'NPT5914593', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '81bfb463-cd12-449a-8a89-3e4e30e4672c', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('eec432a6-5ec9-4ce0-bde9-a685b373adc0', 'NPT5914586', 'NPT5914586', 'NPT5914586', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '28669dab-7ffe-4ae2-8aca-64ae52d19422', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL),
('f6b43212-a903-43b5-9d64-dc4e9b78e4e1', 'NPT5914575', 'NPT5914575', 'NPT5914575', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, 'Disponivel', '2027-06-29 23:00:00', 'Escritorio', 'em_empresa', NULL),
('faa64899-a590-469e-82f0-e3aa27265ca0', 'NPT5914596', 'NPT5914596', 'NPT5914596', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'a4806d71-5c00-416e-b308-3059e8035e54', NULL, '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', 'Disponivel', '2027-06-29 23:00:00', 'Posto', 'em_posto_aguarda', NULL);


-- Dados: laboratorio_condicoes_testes (3 registos)
INSERT INTO `laboratorio_condicoes_testes` (`id`, `laboratorio_id`, `teste_id`, `comissao`, `prazo_pagamento_dias`) VALUES
('206443c1-c255-49b1-a75f-38a3d2d55e56', '5bc17ab8-f6d3-4ebc-9ce7-4b591ff2bf65', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '12.50', 45),
('807db01e-0c08-4991-a32a-c050b74156e2', '3e1f10a7-686f-4f7c-83da-c66dbf991452', 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '10.00', 30),
('9e743d8c-6c6f-4400-9214-8fe6ced03999', 'b09d151d-d976-4da7-a0cb-59f89bbce0f4', 'd25417d9-1bac-4076-b2c5-cb913287900f', '15.00', 60);


-- Dados: laboratorio_contactos_secundarios (8 registos)
INSERT INTO `laboratorio_contactos_secundarios` (`id`, `laboratorio_id`, `ordem`, `nome`, `funcao`, `email`, `telefone`) VALUES
('01cbf78d-09c8-4148-8513-882e15b0203f', 'b09d151d-d976-4da7-a0cb-59f89bbce0f4', 1, 'Luísa Ferreira', 'Direção Técnica', 'l.ferreira@germanosousa.pt', '+351 21 269 3531'),
('256e70ac-3fd6-433b-80b1-129ada68e090', '5bc17ab8-f6d3-4ebc-9ce7-4b591ff2bf65', 2, 'Pedro Santos', 'Coordenação Técnica', 'p.santos@unilabs.pt', '+351 21 381 7702'),
('3479f458-df87-462c-bd38-cf10409fc90e', 'b09d151d-d976-4da7-a0cb-59f89bbce0f4', 2, 'Miguel Costa', 'Comercial', 'm.costa@germanosousa.pt', '+351 21 269 3532'),
('4135fc47-32a6-4d22-bbfa-5c0c5b53ef70', 'da97ef7f-b994-4e1f-a54c-3a1e083d6d9f', 1, 'Sarah Mitchell', 'Lab Manager', 's.mitchell@featurehealth.co.uk', '+44 116 123 4561'),
('417d3ea8-3fa4-45b0-b1cb-fd96b6e78cbe', '3e1f10a7-686f-4f7c-83da-c66dbf991452', 1, 'Carla Mendes', 'Responsável Postos', 'c.mendes@synlab.pt', '+351 21 848 2276'),
('ab5463d2-de34-4e58-bf45-d1ceb1ec873b', 'da97ef7f-b994-4e1f-a54c-3a1e083d6d9f', 2, 'James Cooper', 'Quality Assurance', 'j.cooper@featurehealth.co.uk', '+44 116 123 4562'),
('b6697726-f9d8-48c7-bfea-d933e3f667f6', 'da97ef7f-b994-4e1f-a54c-3a1e083d6d9f', 3, 'Helen Wright', 'Logistics', 'h.wright@featurehealth.co.uk', '+44 116 123 4563'),
('eb518de8-7db4-46f6-b80e-df408f82ab5c', '5bc17ab8-f6d3-4ebc-9ce7-4b591ff2bf65', 1, 'Ana Rodrigues', 'Gestora Comercial', 'a.rodrigues@unilabs.pt', '+351 21 381 7701');


-- Dados: laboratorios (4 registos)
INSERT INTO `laboratorios` (`id`, `nome`, `codigo`, `morada`, `codigo_postal`, `cidade`, `distrito`, `pais`, `contacto`, `email`, `ativo`, `created_at`, `notas`, `tipo`) VALUES
('3e1f10a7-686f-4f7c-83da-c66dbf991452', 'Synlab', 'SLB-001', 'Rua Castilho, 39 - 6º', '1250-066', 'Lisboa', 'Lisboa', 'Portugal', '+351 21 848 2275', 'info@synlab.pt', 1, '2026-06-26 22:47:57', 'Laboratório operacional — colheitas e logística.', 'operacional'),
('5bc17ab8-f6d3-4ebc-9ce7-4b591ff2bf65', 'Unilabs', 'UNI-001', 'Rua Castilho, 39 - 6º', '1250-066', 'Lisboa', 'Lisboa', 'Portugal', '+351 21 381 7700', 'clientes@unilabs.pt', 1, '2026-06-26 22:47:57', 'Rede nacional de medicina laboratorial.', 'operacional'),
('b09d151d-d976-4da7-a0cb-59f89bbce0f4', 'Germano de Sousa', 'GDS-001', 'R. Cupertino de Miranda', '1600-513', 'Lisboa', 'Lisboa', 'Portugal', '+351 21 269 3530', 'clientes@germanosousa.pt', 1, '2026-06-26 22:47:57', 'Medicina laboratorial — sede e rede de postos.', 'operacional'),
('da97ef7f-b994-4e1f-a54c-3a1e083d6d9f', 'FeatureHealth UK', 'FHUK-001', 'Unit 5, Apex Business Park, Apex Way', 'LE19 1SX', 'Hinckley', 'Leicestershire', 'Reino Unido', '+44 116 123 4567', 'lab@featurehealth.co.uk', 1, '2026-06-26 22:47:57', 'Laboratório final de processamento NIPT.', 'final');


-- Dados: logs_auditoria (6 registos)
INSERT INTO `logs_auditoria` (`id`, `empresa_id`, `utilizador_id`, `acao`, `tabela_afetada`, `registro_id`, `data`) VALUES
('412733a8-93de-40df-997e-8de815719e11', NULL, '74cedf4b-3b26-45b7-a396-4a15bfce0828', 'Criou paciente', 'pacientes', 'e597b5ef-454f-4b5b-b58c-69f2af6104c5', '2026-06-26 23:06:06'),
('5aaaaf3b-fd1f-4033-8fb2-ee9610ade31b', NULL, '74cedf4b-3b26-45b7-a396-4a15bfce0828', 'Atualizou paciente', 'pacientes', 'e597b5ef-454f-4b5b-b58c-69f2af6104c5', '2026-06-26 23:17:43'),
('81e110f8-afe3-4bbc-91db-1f4902241338', NULL, '74cedf4b-3b26-45b7-a396-4a15bfce0828', 'Atualizou paciente', 'pacientes', 'e597b5ef-454f-4b5b-b58c-69f2af6104c5', '2026-06-26 23:18:15'),
('8db97684-5204-455f-90eb-5a65bec55241', NULL, '74cedf4b-3b26-45b7-a396-4a15bfce0828', 'Atualizou paciente', 'pacientes', 'e597b5ef-454f-4b5b-b58c-69f2af6104c5', '2026-06-26 23:18:06'),
('c6d8ee6a-6194-4c4c-b8a9-1a66f6c9566a', NULL, '74cedf4b-3b26-45b7-a396-4a15bfce0828', 'Kit utilizado em colheita', 'postos', 'a724d977-d4a4-434e-b54f-8ac8fda74ef7', '2026-06-26 23:18:15'),
('edfe35de-daee-4409-8e97-e0622f5cc596', '5c7356ae-cdde-4e06-b473-da17686e8daa', '74cedf4b-3b26-45b7-a396-4a15bfce0828', 'Criou processo', 'processos', '6c775e84-2fbc-4856-92ea-51f32b11db48', '2026-06-26 23:18:15');


-- Dados: lotes (1 registos)
INSERT INTO `lotes` (`id`, `codigo_lote`, `tipo_kit_id`, `data_rececao`, `quantidade`, `fornecedor_id`, `validade`, `estado`, `tipo_teste`, `teste_id`) VALUES
('a4806d71-5c00-416e-b308-3059e8035e54', 'LOTE-MAT-2026-01', '53706ed2-19de-4f69-a1aa-c506d2e36ca0', '2026-01-10 00:00:00', 34, '5c7356ae-cdde-4e06-b473-da17686e8daa', '2027-06-29 23:00:00', 'Disponivel', 'Maternity', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437');


-- Dados: medico_condicoes_testes (5 registos)
INSERT INTO `medico_condicoes_testes` (`id`, `medico_id`, `teste_id`, `comissao`, `prazo_pagamento_dias`) VALUES
('00f08972-1a1f-4504-abef-5d595cf0fcd8', '210eec06-29dc-4cdc-aaa7-30b7e2bd1a7f', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '8.00', 30),
('10d8deee-69dc-4a21-b53d-272ae1540842', '210eec06-29dc-4cdc-aaa7-30b7e2bd1a7f', 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '10.00', 30),
('91429b3f-a024-4e5b-958c-4fcfa1a2c019', '74cedf4b-3b26-45b7-a396-4a15bfce0828', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '9.00', 30),
('a10a3c9b-26ff-42cd-8916-f04b057676cf', '1cabd90d-0e3d-4722-9568-d225a464e6a4', 'd25417d9-1bac-4076-b2c5-cb913287900f', '12.00', 45),
('bcb7faaa-2661-4c98-a69c-bc5b23f2bba2', '74cedf4b-3b26-45b7-a396-4a15bfce0828', 'd25417d9-1bac-4076-b2c5-cb913287900f', '14.00', 45);


-- Dados: medico_contactos_secundarios (5 registos)
INSERT INTO `medico_contactos_secundarios` (`id`, `medico_id`, `ordem`, `nome`, `funcao`, `email`, `telefone`) VALUES
('54b963c4-9d5d-4deb-b302-18321a6001ac', '74cedf4b-3b26-45b7-a396-4a15bfce0828', 1, 'Assistente Clínico', 'Assistente', 'assistente.anaclara@genoma.pt', '222 435 325'),
('a104343c-362d-49ec-9c6e-7f705d3f5158', '210eec06-29dc-4cdc-aaa7-30b7e2bd1a7f', 1, 'Secretariado Dr. Manuel', 'Secretariado', 'secretaria.manuel@genoma.pt', '+351 22 123 4568'),
('b759acd6-bc18-4e88-a3cd-01fd2f92654b', '210eec06-29dc-4cdc-aaa7-30b7e2bd1a7f', 2, 'Enfermeira Coordenadora', 'Enfermagem', 'enfermagem.manuel@genoma.pt', '+351 22 123 4569'),
('bcdcf57e-be16-47f8-9638-2e13fef73e16', '74cedf4b-3b26-45b7-a396-4a15bfce0828', 2, 'Coordenação Obstétrica', 'Coordenação', 'coord.obstetricia@genoma.pt', '222 435 326'),
('f33bb2dd-16b9-403a-9e0a-12478c2ac31f', '1cabd90d-0e3d-4722-9568-d225a464e6a4', 1, 'Gabinete Dra. Sofia', 'Secretariado', 'gabinete.sofia@genoma.pt', '+351 21 234 5679');


-- Dados: medico_locais_trabalho (9 registos)
INSERT INTO `medico_locais_trabalho` (`id`, `medico_id`, `entidade_id`) VALUES
('0525e84a-2312-4bbf-8ba8-5f73492854de', '74cedf4b-3b26-45b7-a396-4a15bfce0828', '950408c3-44c9-4894-bddf-5b221e75c626'),
('1259bd5d-1455-4f28-8235-ad0ff4ceeb83', '1cabd90d-0e3d-4722-9568-d225a464e6a4', 'f1d386b3-53e9-42a6-817b-69beecf3d042'),
('28fde234-1eec-4509-b301-048d606fb991', '1cabd90d-0e3d-4722-9568-d225a464e6a4', '251cfd47-aa76-4b32-85da-73e21ce85efe'),
('410a19d7-5a2d-4d73-8fb0-8ddbc685371e', '210eec06-29dc-4cdc-aaa7-30b7e2bd1a7f', '950408c3-44c9-4894-bddf-5b221e75c626'),
('5753ef19-39f8-473e-be29-76d4a254e017', '210eec06-29dc-4cdc-aaa7-30b7e2bd1a7f', '2aa5fecb-b00b-47e1-8ef6-6c89d2f295aa'),
('767c50fc-3fe7-4388-bc60-7222f730d496', '210eec06-29dc-4cdc-aaa7-30b7e2bd1a7f', '776de444-8ea9-4cda-bfb1-066f56da5042'),
('ca5e1761-5445-489c-ba5d-23b26bec1dbe', '74cedf4b-3b26-45b7-a396-4a15bfce0828', '79030b88-f50a-4003-9b94-18bf75544f83'),
('e80fdc73-ce52-491c-b5c5-d2b953f94b3a', '74cedf4b-3b26-45b7-a396-4a15bfce0828', '2aa5fecb-b00b-47e1-8ef6-6c89d2f295aa'),
('e8ba71cd-b257-43a0-84d8-a3974f0e6148', '1cabd90d-0e3d-4722-9568-d225a464e6a4', '7bad509b-538e-4a57-a6ad-14a3426f1ad9');


-- Dados: medicos (3 registos)
INSERT INTO `medicos` (`utilizador_id`, `num_ordem`, `especialidade`, `ativo`, `titulo`, `genero`, `pais`, `telefone_fixo`, `criterio_busca_postos`, `notas`) VALUES
('1cabd90d-0e3d-4722-9568-d225a464e6a4', '28476578', 'Medicina Materno-Fetal', 1, 'Dra.', 'Feminino', 'Portugal', '+351 21 234 5678', 'cidade', 'Consultas em Lisboa e margem sul.'),
('210eec06-29dc-4cdc-aaa7-30b7e2bd1a7f', '28476553', 'Obstetrícia e Ginecologia', 1, 'Dr.', 'Masculino', 'Portugal', '+351 22 123 4567', 'nome', 'Médico prescrivente — zona Norte.'),
('74cedf4b-3b26-45b7-a396-4a15bfce0828', '3124235233', 'Obstetrícia', 1, 'Dra.', 'Feminino', 'Portugal', '222 435 324', 'nome', 'Rede CUF e Trofa — Porto.');


-- Dados: motivos_anulacao (4 registos)
INSERT INTO `motivos_anulacao` (`id`, `nome`, `ativo`, `created_at`, `contexto`, `reabre_contacto`) VALUES
('04daadbf-cc13-4450-b449-d6a929ded6cd', 'Desistência', 1, '2026-06-26 22:47:57', 'contacto', 0),
('243419e2-2203-4c54-9dcb-7cc9a1e2535d', 'Perda do bebé', 1, '2026-06-26 22:47:57', 'contacto', 0),
('697236dd-0d35-43d1-b03a-541fcc9ab912', 'Repetição de colheita', 1, '2026-06-26 22:47:57', 'processo', 1),
('f57e6fa4-11d1-4d8e-a7a5-5ef8c2acc337', 'Erro atribuição processo', 1, '2026-06-26 22:47:57', 'processo', 0);


-- Dados: movimentos_kits (25 registos)
INSERT INTO `movimentos_kits` (`id`, `data`, `kit_id`, `origem`, `destino`, `motivo`, `observacoes`, `requisicao_id`, `created_at`, `origem_empresa_id`, `origem_posto_id`, `origem_laboratorio_id`, `destino_empresa_id`, `destino_posto_id`, `destino_laboratorio_id`, `processo_id`) VALUES
('0543f24e-b170-4ddc-8869-e9f49c53e21a', '2026-01-10 00:00:00', '631a13a6-3c4f-40d3-80f0-6f20970f14d0', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', 'ff1c9eed-8ea8-45d3-854a-360be119fd0a', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', NULL, NULL),
('10e46fac-f457-47e0-9474-49477880c1b6', '2026-01-10 00:00:00', '983d8416-5441-401a-8b02-4b1d39c6599c', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '2e3196af-d4ba-4bba-8150-131d33974e21', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', NULL, NULL),
('170c2889-a1a8-4d32-a274-43d8e37e5515', '2026-01-10 00:00:00', 'c30bb25f-ff6c-428f-bd2f-59e7a67ef0f1', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '34a584ea-f5da-4e60-ba75-80f774e783c9', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '5f1a666c-007d-463a-a693-556a3cfd1001', NULL, NULL),
('2043e5c6-d5bf-4a59-8971-11bead64328d', '2026-01-10 00:00:00', 'ab605b04-ccc6-4b6f-9d39-1103026bc02c', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '4fe407ed-e0a8-4285-a5b8-d68ca7cd0f21', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', NULL, NULL),
('214b9385-b06e-4ae0-ad6c-ef5d5e2dcfe8', '2026-01-10 00:00:00', 'e33d9b9d-ba2e-42d9-8021-e4a120aed876', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '53a60fbc-5c97-4e19-ace8-d71682b4eab4', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '81bfb463-cd12-449a-8a89-3e4e30e4672c', NULL, NULL),
('2af3f530-a4ce-4e01-b7e7-8f26829ba18b', '2026-01-10 00:00:00', 'c1f72f81-0eed-4038-a5cc-44a9a48f9c5d', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '53a60fbc-5c97-4e19-ace8-d71682b4eab4', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '81bfb463-cd12-449a-8a89-3e4e30e4672c', NULL, NULL),
('3be276fc-a92a-4c7e-8153-f07ff4bca733', '2026-01-10 00:00:00', '9542160a-4023-4583-b05b-9f55e1dd0f81', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '4fe407ed-e0a8-4285-a5b8-d68ca7cd0f21', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', NULL, NULL),
('3bfff3cd-a9dd-4fa6-b832-d664e87fe326', '2026-01-10 00:00:00', '8c10e0be-c624-428b-af67-e50831e6a2c0', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '53a60fbc-5c97-4e19-ace8-d71682b4eab4', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '81bfb463-cd12-449a-8a89-3e4e30e4672c', NULL, NULL),
('50a0d211-7cb9-4133-8998-0cd24c0e7e08', '2026-01-10 00:00:00', 'c1c4f322-2083-4283-bbb5-6aa720c7bd48', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '017add43-fe53-4666-a94a-00fffbb54a0d', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'df9b1034-ba18-45cc-958c-50a546868ff7', NULL, NULL),
('5713438b-75a9-4f31-827b-8d2f15c81ad0', '2026-01-10 00:00:00', '82231c1b-2664-4d90-b531-55c3750ec3c9', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '017add43-fe53-4666-a94a-00fffbb54a0d', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'df9b1034-ba18-45cc-958c-50a546868ff7', NULL, NULL),
('5b09194b-be56-46a0-a655-3fab7db178a4', '2026-01-10 00:00:00', '27943e0b-e2e6-4a32-9555-73f1b08fef09', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', 'ff1c9eed-8ea8-45d3-854a-360be119fd0a', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', NULL, NULL),
('6d589763-0359-4258-9252-b5a5d77d093f', '2026-01-10 00:00:00', '85b2c590-22c7-494d-940a-9aa1c7251e19', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '2e3196af-d4ba-4bba-8150-131d33974e21', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', NULL, NULL),
('7476161f-5b98-486b-8a5b-1aa1850a7557', '2026-01-10 00:00:00', '87d3eb37-8729-459a-a6aa-f96f1912155e', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '4fe407ed-e0a8-4285-a5b8-d68ca7cd0f21', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', NULL, NULL),
('74f5fd5a-4b60-4a4f-966f-a0cdcad5c62a', '2026-01-10 00:00:00', '8ee53ee0-442f-4ed5-9a2b-c98ab5ab6c71', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', 'df004a5f-57a2-44d4-879f-1e7c4efbbbab', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', NULL, NULL),
('7d875bde-bb1c-4020-9994-d8428188ca34', '2026-01-10 00:00:00', '099590bd-e502-4ce5-96bf-3bc3f8a931a0', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', 'df004a5f-57a2-44d4-879f-1e7c4efbbbab', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', NULL, NULL),
('805885dd-53a3-4162-9a68-519bab4533c1', '2026-01-10 00:00:00', '0ba4b051-4218-4c07-961b-a15e7bebc5c7', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', 'ff1c9eed-8ea8-45d3-854a-360be119fd0a', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', NULL, NULL),
('877d1441-ffe0-4643-a4bd-754a413e2a04', '2026-01-10 00:00:00', '6a0d4fa3-b8f5-4c91-b5a9-a47bcebb2c29', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '34a584ea-f5da-4e60-ba75-80f774e783c9', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '5f1a666c-007d-463a-a693-556a3cfd1001', NULL, NULL),
('a532e250-6966-42d3-8c97-9e9f77b16af5', '2026-01-10 00:00:00', 'faa64899-a590-469e-82f0-e3aa27265ca0', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', 'df004a5f-57a2-44d4-879f-1e7c4efbbbab', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', NULL, NULL),
('b559c504-5e75-4519-b4e7-1b39966b5679', '2026-01-10 00:00:00', 'a724d977-d4a4-434e-b54f-8ac8fda74ef7', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '53ac2524-138f-4d7a-9c8c-69ad7139dff9', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '28669dab-7ffe-4ae2-8aca-64ae52d19422', NULL, NULL),
('b5ccab4c-f9ae-42eb-b347-51fc5b92e637', '2026-01-10 00:00:00', 'a316d0d4-b60e-4612-bbd2-4c6f053a37c5', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '53ac2524-138f-4d7a-9c8c-69ad7139dff9', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '28669dab-7ffe-4ae2-8aca-64ae52d19422', NULL, NULL),
('bc5df237-f758-4f48-afb5-489459610edc', '2026-01-10 00:00:00', 'dd64e60f-b5fa-4457-b27b-0fc7f56f079e', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '34a584ea-f5da-4e60-ba75-80f774e783c9', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '5f1a666c-007d-463a-a693-556a3cfd1001', NULL, NULL),
('befa60ab-cd55-42c7-9e98-f19044e5ffbc', '2026-06-25 23:00:00', 'a724d977-d4a4-434e-b54f-8ac8fda74ef7', 'Posto', 'Posto', 'ConsumoColheita', 'Kit consumido na colheita — aguarda envio para laboratório final', NULL, '2026-06-26 23:18:15', NULL, '28669dab-7ffe-4ae2-8aca-64ae52d19422', NULL, NULL, '28669dab-7ffe-4ae2-8aca-64ae52d19422', NULL, '6c775e84-2fbc-4856-92ea-51f32b11db48'),
('dfaa24ad-c351-4898-8379-041aa205b705', '2026-01-10 00:00:00', 'c8b34515-a1c5-49a3-94d4-bbf32469b924', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '017add43-fe53-4666-a94a-00fffbb54a0d', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'df9b1034-ba18-45cc-958c-50a546868ff7', NULL, NULL),
('f1af099f-6107-44f2-99c7-6b464ac2a7b2', '2026-01-10 00:00:00', '1f09d2d6-f3a3-41d9-91eb-4b1b3f526762', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '2e3196af-d4ba-4bba-8150-131d33974e21', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', NULL, NULL),
('f46916cb-750d-4755-b03b-98991becf0b7', '2026-01-10 00:00:00', 'eec432a6-5ec9-4ce0-bde9-a685b373adc0', 'Escritorio', 'Posto', 'Envio', 'Seed — envio escritório → posto', '53ac2524-138f-4d7a-9c8c-69ad7139dff9', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '28669dab-7ffe-4ae2-8aca-64ae52d19422', NULL, NULL);


-- Dados: pacientes (1 registos)
INSERT INTO `pacientes` (`id`, `nome`, `data_nascimento`, `genero`, `nif`, `telemovel`, `email`, `morada`, `altura`, `peso`, `created_at`, `ativo`, `codigo_postal`, `pais`, `distrito`, `cidade`, `medico_id`, `teste_id`, `tipo_gravidez`, `onde_seguida`, `posto_colheita_id`, `data_colheita_prevista`, `notas_internas`, `estado_agendamento`, `gestacao_semanas_registo`, `gestacao_dias_registo`, `gestacao_registada_em`, `fatura_emitida`, `fatura_numero`, `fatura_data_emissao`, `valor_base`, `desconto_percentual`, `valor_final`, `pagamento_data`, `recibo_numero`, `pago`, `entidade_multibanco`, `referencia_multibanco`, `nao_gera_comissao`, `fatura_envio_email`, `fatura_envio_sms`, `estado_contacto`, `motivo_anulacao_id`, `data_anulacao`) VALUES
('e597b5ef-454f-4b5b-b58c-69f2af6104c5', 'Rita Isabel Soares Damas', '2000-04-04 23:00:00', 'F', '578398745', '912548856', 'ritaisabel@gmail.com', 'Rua Central do Olival', '165.00', '65.00', '2026-06-26 23:06:06', 1, '4415-362', 'Portugal', 'Porto', 'Vila Nova de Gaia', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, '0.00', '0.00', '0.00', NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL);


-- Dados: perfil_stock_submodulos (18 registos)
INSERT INTO `perfil_stock_submodulos` (`perfil_id`, `submodulo`, `permitido`, `updated_at`) VALUES
('8fd47317-ddb7-45c6-a928-d4be397933bb', 'auditoria', 1, '2026-06-26 22:47:57'),
('8fd47317-ddb7-45c6-a928-d4be397933bb', 'descartes', 1, '2026-06-26 22:47:57'),
('8fd47317-ddb7-45c6-a928-d4be397933bb', 'kits', 1, '2026-06-26 22:47:57'),
('8fd47317-ddb7-45c6-a928-d4be397933bb', 'lotes', 1, '2026-06-26 22:47:57'),
('8fd47317-ddb7-45c6-a928-d4be397933bb', 'movimentos', 1, '2026-06-26 22:47:57'),
('8fd47317-ddb7-45c6-a928-d4be397933bb', 'requisicoes', 1, '2026-06-26 22:47:57'),
('c37ed584-57d5-44ab-b0a8-9a45a345f2e3', 'auditoria', 1, '2026-06-26 22:47:57'),
('c37ed584-57d5-44ab-b0a8-9a45a345f2e3', 'descartes', 1, '2026-06-26 22:47:57'),
('c37ed584-57d5-44ab-b0a8-9a45a345f2e3', 'kits', 1, '2026-06-26 22:47:57'),
('c37ed584-57d5-44ab-b0a8-9a45a345f2e3', 'lotes', 1, '2026-06-26 22:47:57'),
('c37ed584-57d5-44ab-b0a8-9a45a345f2e3', 'movimentos', 1, '2026-06-26 22:47:57'),
('c37ed584-57d5-44ab-b0a8-9a45a345f2e3', 'requisicoes', 1, '2026-06-26 22:47:57'),
('f4f873e8-6a26-4fb7-9a8e-7c24896ada24', 'auditoria', 1, '2026-06-26 22:47:57'),
('f4f873e8-6a26-4fb7-9a8e-7c24896ada24', 'descartes', 1, '2026-06-26 22:47:57'),
('f4f873e8-6a26-4fb7-9a8e-7c24896ada24', 'kits', 1, '2026-06-26 22:47:57'),
('f4f873e8-6a26-4fb7-9a8e-7c24896ada24', 'lotes', 1, '2026-06-26 22:47:57'),
('f4f873e8-6a26-4fb7-9a8e-7c24896ada24', 'movimentos', 1, '2026-06-26 22:47:57'),
('f4f873e8-6a26-4fb7-9a8e-7c24896ada24', 'requisicoes', 1, '2026-06-26 22:47:57');


-- Dados: perfis (3 registos)
INSERT INTO `perfis` (`id`, `nome`, `ativo`) VALUES
('8fd47317-ddb7-45c6-a928-d4be397933bb', 'Administrador', 1),
('c37ed584-57d5-44ab-b0a8-9a45a345f2e3', 'Assistente', 1),
('f4f873e8-6a26-4fb7-9a8e-7c24896ada24', 'Medico', 1);


-- Dados: posto_condicoes_testes (8 registos)
INSERT INTO `posto_condicoes_testes` (`id`, `posto_id`, `teste_id`, `comissao`, `prazo_pagamento_dias`) VALUES
('05a752e8-3461-4acf-aef2-5bfdfb42c0d6', 'df9b1034-ba18-45cc-958c-50a546868ff7', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '6.00', 30),
('1a7b4425-d0b3-43f0-b761-c87c6a471266', 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '6.00', 30),
('4d3a9a66-51d9-4d0c-b440-830f4a9b2b5f', '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '6.00', 30),
('75e7fe49-a45d-4744-bfbe-2cd11861b279', 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '6.00', 30),
('9742ea73-f15a-4892-9771-943f278cd74d', '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '6.00', 30),
('e4c626b5-3d0d-474a-9330-72a7afc242c7', '81bfb463-cd12-449a-8a89-3e4e30e4672c', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '6.00', 30),
('e5a97692-6f49-4307-acd1-929c265fd332', '5f1a666c-007d-463a-a693-556a3cfd1001', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '6.00', 30),
('f4ac6869-130b-4cea-b22f-40386cf1093b', '28669dab-7ffe-4ae2-8aca-64ae52d19422', '2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', '6.00', 30);


-- Dados: posto_contactos_secundarios (16 registos)
INSERT INTO `posto_contactos_secundarios` (`id`, `posto_id`, `ordem`, `nome`, `funcao`, `email`, `telefone`) VALUES
('1f807bf0-5fa6-438b-8cc8-36962786d956', 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', 2, 'Coordenação Amostras', 'Técnico', 'amostras.unip-003@lab.pt', '+351 22 240 1401'),
('2bf00a4c-3085-4d1f-b29c-b38dd41c7b92', '28669dab-7ffe-4ae2-8aca-64ae52d19422', 1, 'Receção Posto', 'Receção', 'posto.gers-002@lab.pt', '+351 22 004 3010'),
('40ac5b73-848a-4099-8aa7-22cd706192bc', '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', 2, 'Coordenação Amostras', 'Técnico', 'amostras.unip-002@lab.pt', '+351 22 240 1401'),
('5c46ff40-7a1d-4912-83de-db9d098ad6e0', '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', 1, 'Receção Posto', 'Receção', 'posto.slbl-001@lab.pt', '+351 21 848 2275'),
('6774ac4b-cedc-4cb4-8404-c78a17e3fc8b', 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', 1, 'Receção Posto', 'Receção', 'posto.unip-003@lab.pt', '+351 22 240 1401'),
('709f90ff-a11b-4aba-8172-2ccc0f455799', '5f1a666c-007d-463a-a693-556a3cfd1001', 2, 'Coordenação Amostras', 'Técnico', 'amostras.unip-001@lab.pt', '+351 22 240 1401'),
('84b2c8c5-b21c-4c3f-a97c-90de91e419f7', 'df9b1034-ba18-45cc-958c-50a546868ff7', 2, 'Coordenação Amostras', 'Técnico', 'amostras.gers-003@lab.pt', '+351 21 796 0294'),
('a726d64f-859f-48c5-929d-35708602a5e0', '81bfb463-cd12-449a-8a89-3e4e30e4672c', 1, 'Receção Posto', 'Receção', 'posto.slbc-001@lab.pt', '+351 300 029 134'),
('aac89713-f9bf-4476-8033-a468511c3ab3', '28669dab-7ffe-4ae2-8aca-64ae52d19422', 2, 'Coordenação Amostras', 'Técnico', 'amostras.gers-002@lab.pt', '+351 22 004 3010'),
('ab87bb15-6333-4807-b889-7107b6d9f214', 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', 2, 'Coordenação Amostras', 'Técnico', 'amostras.gers-001@lab.pt', '+351 21 269 3530'),
('ac2a837d-99d7-4d77-99d8-e6ef922440fd', 'df9b1034-ba18-45cc-958c-50a546868ff7', 1, 'Receção Posto', 'Receção', 'posto.gers-003@lab.pt', '+351 21 796 0294'),
('b6d24294-3eaf-4d28-871c-cebbc57b5dc4', '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', 2, 'Coordenação Amostras', 'Técnico', 'amostras.slbl-001@lab.pt', '+351 21 848 2275'),
('d83f50c9-8927-49b0-ba39-18f3a2202ed3', 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', 1, 'Receção Posto', 'Receção', 'posto.gers-001@lab.pt', '+351 21 269 3530'),
('debbf820-6c4d-466a-827b-0ae0efb6a654', '81bfb463-cd12-449a-8a89-3e4e30e4672c', 2, 'Coordenação Amostras', 'Técnico', 'amostras.slbc-001@lab.pt', '+351 300 029 134'),
('ebc717c9-983f-4d2e-9b78-0650eb3ea628', '5f1a666c-007d-463a-a693-556a3cfd1001', 1, 'Receção Posto', 'Receção', 'posto.unip-001@lab.pt', '+351 22 240 1401'),
('fd34b939-1be7-4f82-babc-b175f9519489', '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', 1, 'Receção Posto', 'Receção', 'posto.unip-002@lab.pt', '+351 22 240 1401');


-- Dados: postos (8 registos)
INSERT INTO `postos` (`id`, `entidade_id`, `nome`, `codigo_posto`, `localizacao`, `morada`, `codigo_postal`, `cidade`, `distrito`, `pais`, `contacto`, `email`, `ativo`, `created_at`, `notas`, `laboratorio_id`) VALUES
('28669dab-7ffe-4ae2-8aca-64ae52d19422', NULL, 'Centro de Medicina Laboratorial Germano de Sousa - Porto', 'GERS-002', NULL, 'R. dos Heróis e dos Mártires de Angola, nº 15, Lj. 18', '4000-285', 'Porto', 'Porto', 'Portugal', '+351 22 004 3010', 'clientes@germanosousa.pt', 1, '2026-06-26 22:47:57', 'Posto de colheita — Centro de Medicina Laboratorial Germano de Sousa - Porto.', 'b09d151d-d976-4da7-a0cb-59f89bbce0f4'),
('5f1a666c-007d-463a-a693-556a3cfd1001', NULL, 'Unilabs Porto | Costa Cabral', 'UNIP-001', NULL, 'Rua de Costa Cabral 2252', '4200-218', 'Porto', 'Porto', 'Portugal', '+351 22 240 1401', 'clientes@unilabs.pt', 1, '2026-06-26 22:47:57', 'Posto de colheita — Unilabs Porto | Costa Cabral.', '5bc17ab8-f6d3-4ebc-9ce7-4b591ff2bf65'),
('81bfb463-cd12-449a-8a89-3e4e30e4672c', NULL, 'Synlab Campanhã', 'SLBC-001', NULL, 'R. Camilo Pessanha 8', '4300-097', 'Porto', 'Porto', 'Portugal', '+351 300 029 134', 'porto@synlab.pt', 1, '2026-06-26 22:47:57', 'Posto de colheita — Synlab Campanhã.', '3e1f10a7-686f-4f7c-83da-c66dbf991452'),
('8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', NULL, 'Unilabs Porto | Constituição Marquês', 'UNIP-002', NULL, 'R. da Constituição 825 R/C', '4200-201', 'Porto', 'Porto', 'Portugal', '+351 22 240 1401', 'clientes@unilabs.pt', 1, '2026-06-26 22:47:57', 'Posto de colheita — Unilabs Porto | Constituição Marquês.', '5bc17ab8-f6d3-4ebc-9ce7-4b591ff2bf65'),
('9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', NULL, 'Synlab Lisboa', 'SLBL-001', NULL, 'Av. de Paris 24', '1000-229', 'Lisboa', 'Lisboa', 'Portugal', '+351 21 848 2275', 'lisboa@synlab.pt', 1, '2026-06-26 22:47:57', 'Posto de colheita — Synlab Lisboa.', '3e1f10a7-686f-4f7c-83da-c66dbf991452'),
('a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', NULL, 'Unilabs Porto | Campo Alegre', 'UNIP-003', NULL, 'Rua do Campo Alegre 231 1º piso', '4150-178', 'Porto', 'Porto', 'Portugal', '+351 22 240 1401', 'clientes@unilabs.pt', 1, '2026-06-26 22:47:57', 'Posto de colheita — Unilabs Porto | Campo Alegre.', '5bc17ab8-f6d3-4ebc-9ce7-4b591ff2bf65'),
('df9b1034-ba18-45cc-958c-50a546868ff7', NULL, 'Germano de Sousa - Avenida de Roma', 'GERS-003', NULL, 'Av. de Roma 45 A', '1700-348', 'Lisboa', 'Lisboa', 'Portugal', '+351 21 796 0294', 'clientes@germanosousa.pt', 1, '2026-06-26 22:47:57', 'Posto de colheita — Germano de Sousa - Avenida de Roma.', 'b09d151d-d976-4da7-a0cb-59f89bbce0f4'),
('f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', NULL, 'Germano de Sousa - Sede e Laboratório Central Telheiras', 'GERS-001', NULL, 'R. Cupertino de Miranda', '1600-513', 'Lisboa', 'Lisboa', 'Portugal', '+351 21 269 3530', 'clientes@germanosousa.pt', 1, '2026-06-26 22:47:57', 'Posto de colheita — Germano de Sousa - Sede e Laboratório Central Telheiras.', 'b09d151d-d976-4da7-a0cb-59f89bbce0f4');


-- Dados: processo_status (9 registos)
INSERT INTO `processo_status` (`nome`, `ordem`, `ativo`) VALUES
('Agendado', 1, 1),
('Cancelado', 9, 1),
('Colheita Realizada', 3, 1),
('Em Analise', 5, 1),
('Enviado Laboratorio', 4, 1),
('Faturado', 8, 1),
('Kit Reservado', 2, 1),
('Resultado Disponivel', 6, 1),
('Validado', 7, 1);


-- Dados: processos (1 registos)
INSERT INTO `processos` (`id`, `numero_processo`, `paciente_id`, `medico_id`, `posto_id`, `kit_id`, `status_id`, `data_entrada`, `notas`, `teste_id`, `empresa_id`, `posto`, `data_colheita`, `data_chegada_laboratorio`, `data_resultado`, `data_validacao`, `data_envio_relatorio`, `responsavel_fluxo`, `relatorio_validado`, `relatorio_enviado_para`, `resultado_tudo_ok`, `resultado_anomalias`, `fatura_emitida`, `fatura_numero`, `fatura_data_emissao`, `valor_base`, `desconto_percentual`, `valor_final`, `pagamento_data`, `recibo_numero`, `observacoes`, `fracao_fetal`, `pago`, `data_colheita_prevista`, `laboratorio_final_id`, `entidade_multibanco`, `referencia_multibanco`, `nao_gera_comissao`, `fatura_envio_email`, `fatura_envio_sms`, `motivo_anulacao_id`, `data_anulacao`) VALUES
('6c775e84-2fbc-4856-92ea-51f32b11db48', 'NPT5914587', 'e597b5ef-454f-4b5b-b58c-69f2af6104c5', '74cedf4b-3b26-45b7-a396-4a15bfce0828', '28669dab-7ffe-4ae2-8aca-64ae52d19422', 'a724d977-d4a4-434e-b54f-8ac8fda74ef7', 'Colheita Realizada', '2026-06-26 23:00:00', NULL, 'caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', '5c7356ae-cdde-4e06-b473-da17686e8daa', 'Centro de Medicina Laboratorial Germano de Sousa - Porto', '2026-06-25 23:00:00', NULL, NULL, NULL, NULL, NULL, 0, 'Nenhum', 1, NULL, 0, NULL, NULL, '496.00', '10.00', '446.40', NULL, NULL, NULL, NULL, 0, '2026-06-26 23:00:00', 'da97ef7f-b994-4e1f-a54c-3a1e083d6d9f', NULL, NULL, 0, NULL, NULL, NULL, NULL);


-- Dados: requisicao_kits_itens (24 registos)
INSERT INTO `requisicao_kits_itens` (`id`, `requisicao_id`, `kit_id`, `created_at`) VALUES
('3ca6762f-24f1-4339-812b-cbc09c6760b7', '017add43-fe53-4666-a94a-00fffbb54a0d', '82231c1b-2664-4d90-b531-55c3750ec3c9', '2026-06-26 22:47:57'),
('3f3dadf2-b3e9-46d6-9fa8-7603263cc5af', '2e3196af-d4ba-4bba-8150-131d33974e21', '983d8416-5441-401a-8b02-4b1d39c6599c', '2026-06-26 22:47:57'),
('4b18779d-ebf6-4ffa-91c5-5d9784dc1d43', '53a60fbc-5c97-4e19-ace8-d71682b4eab4', '8c10e0be-c624-428b-af67-e50831e6a2c0', '2026-06-26 22:47:57'),
('4dfdd52e-b1ea-4555-8e39-91fc8e423fc9', '53ac2524-138f-4d7a-9c8c-69ad7139dff9', 'eec432a6-5ec9-4ce0-bde9-a685b373adc0', '2026-06-26 22:47:57'),
('5936ea19-4f0a-486d-9681-5d7d80470fe4', '53a60fbc-5c97-4e19-ace8-d71682b4eab4', 'e33d9b9d-ba2e-42d9-8021-e4a120aed876', '2026-06-26 22:47:57'),
('6bc02add-7455-40d4-8ff6-604b3693f07f', 'ff1c9eed-8ea8-45d3-854a-360be119fd0a', '0ba4b051-4218-4c07-961b-a15e7bebc5c7', '2026-06-26 22:47:57'),
('780ada5d-7027-4d8a-b9af-403623b5d048', '2e3196af-d4ba-4bba-8150-131d33974e21', '1f09d2d6-f3a3-41d9-91eb-4b1b3f526762', '2026-06-26 22:47:57'),
('806f6add-2c0f-4757-83dc-9027165560e1', '017add43-fe53-4666-a94a-00fffbb54a0d', 'c1c4f322-2083-4283-bbb5-6aa720c7bd48', '2026-06-26 22:47:57'),
('8e012068-412a-4978-a434-4cb9eb6c1ecb', '2e3196af-d4ba-4bba-8150-131d33974e21', '85b2c590-22c7-494d-940a-9aa1c7251e19', '2026-06-26 22:47:57'),
('93efc24a-c91e-4ecb-8b97-899154e4e9b7', '4fe407ed-e0a8-4285-a5b8-d68ca7cd0f21', '87d3eb37-8729-459a-a6aa-f96f1912155e', '2026-06-26 22:47:57'),
('b3ab0b45-c121-474e-8681-4488e7a090b0', 'df004a5f-57a2-44d4-879f-1e7c4efbbbab', '8ee53ee0-442f-4ed5-9a2b-c98ab5ab6c71', '2026-06-26 22:47:57'),
('b7926471-fb30-4a6d-ac3e-296618108fb7', 'df004a5f-57a2-44d4-879f-1e7c4efbbbab', '099590bd-e502-4ce5-96bf-3bc3f8a931a0', '2026-06-26 22:47:57'),
('c67d7078-8ed3-4a88-90aa-4090757e8893', 'ff1c9eed-8ea8-45d3-854a-360be119fd0a', '27943e0b-e2e6-4a32-9555-73f1b08fef09', '2026-06-26 22:47:57'),
('d21035c1-46f5-4ced-9fe3-8b94b66965c2', '34a584ea-f5da-4e60-ba75-80f774e783c9', 'dd64e60f-b5fa-4457-b27b-0fc7f56f079e', '2026-06-26 22:47:57'),
('d386e4f6-ca14-457f-a64c-57e538f72873', '017add43-fe53-4666-a94a-00fffbb54a0d', 'c8b34515-a1c5-49a3-94d4-bbf32469b924', '2026-06-26 22:47:57'),
('da7fcbb3-2e0c-4eff-acd1-fedd66aedbc2', 'ff1c9eed-8ea8-45d3-854a-360be119fd0a', '631a13a6-3c4f-40d3-80f0-6f20970f14d0', '2026-06-26 22:47:57'),
('e0641cbb-099f-441e-9f17-46835b425aa9', '53ac2524-138f-4d7a-9c8c-69ad7139dff9', 'a316d0d4-b60e-4612-bbd2-4c6f053a37c5', '2026-06-26 22:47:57'),
('e32586d7-d9b0-4865-9bb1-cafce980d4af', '53a60fbc-5c97-4e19-ace8-d71682b4eab4', 'c1f72f81-0eed-4038-a5cc-44a9a48f9c5d', '2026-06-26 22:47:57'),
('ec09f732-b2f3-4661-b734-98ffb9582188', '53ac2524-138f-4d7a-9c8c-69ad7139dff9', 'a724d977-d4a4-434e-b54f-8ac8fda74ef7', '2026-06-26 22:47:57'),
('edddfa8a-fda4-4542-9ab2-1d3e3d8aa68f', '4fe407ed-e0a8-4285-a5b8-d68ca7cd0f21', '9542160a-4023-4583-b05b-9f55e1dd0f81', '2026-06-26 22:47:57'),
('eec32cba-688a-41ac-b1de-aac7395fdff1', '34a584ea-f5da-4e60-ba75-80f774e783c9', 'c30bb25f-ff6c-428f-bd2f-59e7a67ef0f1', '2026-06-26 22:47:57'),
('f778032c-a0b5-484a-b89a-967ca32f0a89', 'df004a5f-57a2-44d4-879f-1e7c4efbbbab', 'faa64899-a590-469e-82f0-e3aa27265ca0', '2026-06-26 22:47:57'),
('fb591587-f72c-4055-aa39-8c404ed22567', '34a584ea-f5da-4e60-ba75-80f774e783c9', '6a0d4fa3-b8f5-4c91-b5a9-a47bcebb2c29', '2026-06-26 22:47:57'),
('fc1d8872-2ae5-448e-ad8a-c752144a1a9f', '4fe407ed-e0a8-4285-a5b8-d68ca7cd0f21', 'ab605b04-ccc6-4b6f-9d39-1103026bc02c', '2026-06-26 22:47:57');


-- Dados: requisicoes_kits (8 registos)
INSERT INTO `requisicoes_kits` (`id`, `numero_envio`, `utilizador_id`, `data`, `origem`, `destino`, `quantidade`, `status`, `tracking_number`, `transportadora`, `lote_id`, `observacoes`, `created_at`, `origem_empresa_id`, `origem_posto_id`, `origem_laboratorio_id`, `destino_empresa_id`, `destino_posto_id`, `destino_laboratorio_id`, `origem_nome`, `destino_nome`) VALUES
('017add43-fe53-4666-a94a-00fffbb54a0d', 'ENV-2026-00003', 'bedc7ff6-fba9-4f9e-8677-458d0ad40eaf', '2026-01-10 00:00:00', 'Escritorio', 'Posto', 3, 'Entregue', 'NPT5914589, NPT5914590, NPT5914591', NULL, 'a4806d71-5c00-416e-b308-3059e8035e54', 'Seed — envio escritório → posto', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'df9b1034-ba18-45cc-958c-50a546868ff7', NULL, 'Genoma', 'Germano de Sousa - Avenida de Roma'),
('2e3196af-d4ba-4bba-8150-131d33974e21', 'ENV-2026-00007', 'bedc7ff6-fba9-4f9e-8677-458d0ad40eaf', '2026-01-10 00:00:00', 'Escritorio', 'Posto', 3, 'Entregue', 'NPT5914601, NPT5914602, NPT5914603', NULL, 'a4806d71-5c00-416e-b308-3059e8035e54', 'Seed — envio escritório → posto', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '8419cfa9-ef80-4ad8-aa7e-d28a2b87ecd3', NULL, 'Genoma', 'Unilabs Porto | Constituição Marquês'),
('34a584ea-f5da-4e60-ba75-80f774e783c9', 'ENV-2026-00006', 'bedc7ff6-fba9-4f9e-8677-458d0ad40eaf', '2026-01-10 00:00:00', 'Escritorio', 'Posto', 3, 'Entregue', 'NPT5914598, NPT5914599, NPT5914600', NULL, 'a4806d71-5c00-416e-b308-3059e8035e54', 'Seed — envio escritório → posto', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '5f1a666c-007d-463a-a693-556a3cfd1001', NULL, 'Genoma', 'Unilabs Porto | Costa Cabral'),
('4fe407ed-e0a8-4285-a5b8-d68ca7cd0f21', 'ENV-2026-00001', 'bedc7ff6-fba9-4f9e-8677-458d0ad40eaf', '2026-01-10 00:00:00', 'Escritorio', 'Posto', 3, 'Entregue', 'NPT5914583, NPT5914584, NPT5914585', NULL, 'a4806d71-5c00-416e-b308-3059e8035e54', 'Seed — envio escritório → posto', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'f6eabc47-4550-4b19-b5bc-b27db7c3b6e4', NULL, 'Genoma', 'Germano de Sousa - Sede e Laboratório Central Telheiras'),
('53a60fbc-5c97-4e19-ace8-d71682b4eab4', 'ENV-2026-00004', 'bedc7ff6-fba9-4f9e-8677-458d0ad40eaf', '2026-01-10 00:00:00', 'Escritorio', 'Posto', 3, 'Entregue', 'NPT5914592, NPT5914593, NPT5914594', NULL, 'a4806d71-5c00-416e-b308-3059e8035e54', 'Seed — envio escritório → posto', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '81bfb463-cd12-449a-8a89-3e4e30e4672c', NULL, 'Genoma', 'Synlab Campanhã'),
('53ac2524-138f-4d7a-9c8c-69ad7139dff9', 'ENV-2026-00002', 'bedc7ff6-fba9-4f9e-8677-458d0ad40eaf', '2026-01-10 00:00:00', 'Escritorio', 'Posto', 3, 'Entregue', 'NPT5914586, NPT5914587, NPT5914588', NULL, 'a4806d71-5c00-416e-b308-3059e8035e54', 'Seed — envio escritório → posto', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '28669dab-7ffe-4ae2-8aca-64ae52d19422', NULL, 'Genoma', 'Centro de Medicina Laboratorial Germano de Sousa - Porto'),
('df004a5f-57a2-44d4-879f-1e7c4efbbbab', 'ENV-2026-00005', 'bedc7ff6-fba9-4f9e-8677-458d0ad40eaf', '2026-01-10 00:00:00', 'Escritorio', 'Posto', 3, 'Entregue', 'NPT5914595, NPT5914596, NPT5914597', NULL, 'a4806d71-5c00-416e-b308-3059e8035e54', 'Seed — envio escritório → posto', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, '9640cc9d-c3e2-4ff5-b3a1-e596aac4e41e', NULL, 'Genoma', 'Synlab Lisboa'),
('ff1c9eed-8ea8-45d3-854a-360be119fd0a', 'ENV-2026-00008', 'bedc7ff6-fba9-4f9e-8677-458d0ad40eaf', '2026-01-10 00:00:00', 'Escritorio', 'Posto', 3, 'Entregue', 'NPT5914604, NPT5914605, NPT5914606', NULL, 'a4806d71-5c00-416e-b308-3059e8035e54', 'Seed — envio escritório → posto', '2026-06-26 22:47:57', '5c7356ae-cdde-4e06-b473-da17686e8daa', NULL, NULL, NULL, 'a7da3aa9-cb98-4323-abad-5c6d3ceb7ec0', NULL, 'Genoma', 'Unilabs Porto | Campo Alegre');


-- Dados: testes (4 registos)
INSERT INTO `testes` (`id`, `nome`, `preco`, `descricao`, `ativo`, `codigo`, `categoria`, `laboratorio_id`, `tempo_estimado`, `preco_compra`, `preco_venda`, `tempo_resposta_dias`, `gestacao_minima_semanas`, `tipo_teste`, `empresa`, `tipo_kit`, `cromossomas`, `delecoes_duplicacoes`, `microdelecoes_microduplicacoes`, `gemeos`, `incluir_fracao_fetal`, `laboratorio_processamento_id`, `determinacao_sexo_fetal`, `teste_pai_id`) VALUES
('2aaf7c92-0e6a-4eb1-9ad3-897effb2d437', 'Básico', '372.00', NULL, 1, 'MT-001', NULL, NULL, NULL, '150.00', '372.00', 8, 10, 'Maternity 21 Plus Core', 'Genoma', 'Maternity', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21', 1, 1, 1, 1, 'da97ef7f-b994-4e1f-a54c-3a1e083d6d9f', 1, '93752edc-c16d-45af-9d7d-d37003f0bf84'),
('93752edc-c16d-45af-9d7d-d37003f0bf84', 'Maternity', '0.00', 'Painel NIPT Maternity — testes de rastreio pré-natal não invasivo.', 1, 'MT-001', NULL, NULL, NULL, '0.00', '0.00', NULL, NULL, 'Maternity', 'Genoma', 'Maternity', NULL, 0, 0, 0, 1, NULL, 0, NULL),
('caaa2f36-5f82-4943-8cd3-8cc377e7a1a2', 'Intermédio', '496.00', NULL, 1, 'MT-002', NULL, NULL, NULL, '200.00', '496.00', 10, 10, 'Maternity Intermédio', 'Genoma', 'Maternity', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,21', 0, 0, 0, 1, 'da97ef7f-b994-4e1f-a54c-3a1e083d6d9f', 0, '93752edc-c16d-45af-9d7d-d37003f0bf84'),
('d25417d9-1bac-4076-b2c5-cb913287900f', 'Completo', '744.00', NULL, 1, 'MT-003', NULL, NULL, NULL, '300.00', '744.00', 8, 10, 'Maternity Genome', 'Genoma', 'Maternity', '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23', 1, 1, 1, 1, 'da97ef7f-b994-4e1f-a54c-3a1e083d6d9f', 1, '93752edc-c16d-45af-9d7d-d37003f0bf84');


-- Dados: tipos_kit (1 registos)
INSERT INTO `tipos_kit` (`id`, `nome`, `ativo`, `created_at`) VALUES
('53706ed2-19de-4f69-a1aa-c506d2e36ca0', 'Maternity', 1, '2026-06-26 22:47:57');


-- Dados: utilizadores (5 registos)
INSERT INTO `utilizadores` (`id`, `perfil_id`, `empresa_id`, `nome`, `email`, `telefone`, `password_hash`, `ativo`, `created_at`, `reset_token_hash`, `reset_token_expires_at`, `avatar_url`) VALUES
('1cabd90d-0e3d-4722-9568-d225a464e6a4', 'f4f873e8-6a26-4fb7-9a8e-7c24896ada24', NULL, 'Sofia Silva', 'sofiasilva@genoma.pt', '912764836', '$2b$10$2EEyR4d8iOytFIrUGzF9FeboQ23Mx/K//Woe1sg2I91S66IJGbxbS', 1, '2026-06-26 22:47:57', NULL, NULL, NULL),
('210eec06-29dc-4cdc-aaa7-30b7e2bd1a7f', 'f4f873e8-6a26-4fb7-9a8e-7c24896ada24', NULL, 'Manuel Gomes Silva', 'manuelgomessilva@genoma.pt', '912768365', '$2b$10$8MQHtC3sw07LHv.WNrPkzOQKV2Wrx4l/KtlMdbcvXaqR0Wx.8np1e', 1, '2026-06-26 22:47:57', NULL, NULL, NULL),
('5a25a27b-6fb0-4b46-89b2-db27defdebaf', 'c37ed584-57d5-44ab-b0a8-9a45a345f2e3', '5c7356ae-cdde-4e06-b473-da17686e8daa', 'Assistente Teste', 'assistente.teste@genoma.local', '+351900000003', '$2b$10$wUvybAynxn63XdE6OZwmSeWE3LhiIWCBnSDEs0wFPZk3nATPHe8A2', 1, '2026-06-26 22:47:57', NULL, NULL, NULL),
('74cedf4b-3b26-45b7-a396-4a15bfce0828', 'f4f873e8-6a26-4fb7-9a8e-7c24896ada24', NULL, 'Ana Clara da Costa Ferreira', 'anaclaraferreira@genoma.pt', '912875348', '$2b$10$IDjMYD7MomKnHi7s0yh/6.CKopzYYLr./n0N4ks21hr9QSySSX5I6', 1, '2026-06-26 22:47:57', NULL, NULL, NULL),
('bedc7ff6-fba9-4f9e-8677-458d0ad40eaf', '8fd47317-ddb7-45c6-a928-d4be397933bb', '5c7356ae-cdde-4e06-b473-da17686e8daa', 'Nuno Araújo', 'admin.teste@genoma.local', '+351900000001', '$2b$10$7Zp1BfNWrachEg0QIfgOwenZD.H956HeUYofVJS.qVR5B2ThHtStS', 1, '2026-06-26 22:47:57', NULL, NULL, NULL);


SET FOREIGN_KEY_CHECKS = 1;
-- Fim da exportação