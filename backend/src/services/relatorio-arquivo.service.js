const fs = require('fs');
const path = require('path');
const processosRepository = require('../repositories/processos.repository');
const { getRelatoriosDir, resolveUploadRelativePath } = require('../config/uploads');
const resultadosGeneticosRepository = require('../repositories/resultados_geneticos.repository');
const anexosRepository = require('../repositories/anexos.repository');
const anexosService = require('./anexos.service');
const relatoriosRepository = require('../repositories/relatorios.repository');
const pdfService = require('./pdf.service');
const logService = require('./log.service');

const DEFAULT_TEMPLATE = 'maternity-proposta1';

const RELATORIOS_DIR = getRelatoriosDir();

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const sanitizeFilenamePart = (value) => {
  const seguro = String(value || 'processo').replace(/[^a-zA-Z0-9_-]/g, '');
  return seguro || 'processo';
};

const buildFilename = (processo) => {
  const ref = sanitizeFilenamePart(processo.numero_processo || processo.numero || processo.id);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
  return `Relatorio_${ref}_${stamp}.pdf`;
};

const isRelatorioAnexo = (anexo) =>
  (anexo.titulo && anexo.titulo.startsWith('Relatório #'))
  || (anexo.url && anexo.url.includes('/Relatorio_'));

const buffersIguais = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  return a.compare(b) === 0;
};

const lerUltimoRelatorioPdf = async (processoId) => {
  const anexos = await anexosRepository.findByProcesso(processoId);
  const relatorios = anexos.filter(isRelatorioAnexo);
  if (relatorios.length === 0) return null;

  const ultimo = relatorios[0];
  if (!ultimo.url?.startsWith('uploads/')) return null;

  const absolutePath = resolveUploadRelativePath(ultimo.url);
  if (!fs.existsSync(absolutePath)) return null;

  return { anexo: ultimo, bytes: fs.readFileSync(absolutePath), absolutePath };
};

const contarRelatorios = async (processoId) => {
  const anexos = await anexosRepository.findByProcesso(processoId);
  return anexos.filter(isRelatorioAnexo).length;
};

/**
 * Grava PDF no processo (anexo versionado + processo_relatorios).
 */
const gravarPdfNoProcesso = async (processoId, pdfBytes, user, options = {}) => {
  const template = options.template || DEFAULT_TEMPLATE;
  const origem = options.origem || 'manual';

  const processo = await processosRepository.findById(processoId);
  if (!processo) throw new Error('Processo nao encontrado');

  const ultimo = await lerUltimoRelatorioPdf(processoId);
  if (ultimo && buffersIguais(ultimo.bytes, pdfBytes)) {
    return {
      skipped: true,
      motivo: 'igual_ao_ultimo',
      anexo: ultimo.anexo,
      formato: 'pdf',
    };
  }

  const processoDir = path.join(RELATORIOS_DIR, processoId);
  ensureDir(processoDir);

  const filename = buildFilename(processo);
  const absolutePath = path.join(processoDir, filename);
  fs.writeFileSync(absolutePath, pdfBytes);

  const relativePath = path.join('uploads', 'anexos', 'relatorios', processoId, filename).replace(/\\/g, '/');
  const numero = (await contarRelatorios(processoId)) + 1;
  const numeroProcesso = processo.numero_processo || processo.numero || processoId;

  const anexo = await anexosService.create({
    paciente_id: processo.paciente_id,
    processo_id: processoId,
    tipo: 'Documento',
    titulo: `Relatório #${numero} — ${numeroProcesso}`,
    descricao: origem === 'validacao'
      ? 'Gerado automaticamente na validação do resultado'
      : 'Relatório clínico NIPT gerado manualmente',
    url: relativePath,
  }, user);

  const relatorio = await relatoriosRepository.create({
    processoId,
    template,
    pdfUrl: relativePath,
    observacoes: origem === 'validacao' ? 'Auto-gerado na validação' : null,
  });

  if (user) {
    try {
      await logService.log({
        utilizador_id: user.id,
        acao: origem === 'validacao' ? 'Auto-gerou relatório PDF (validação)' : 'Gerou relatório PDF',
        tabela: 'anexos',
        registro_id: anexo.id,
      });
    } catch (err) {
      console.warn('[relatorio-arquivo] Falha auditoria:', err.message);
    }
  }

  return {
    skipped: false,
    anexo,
    relatorio,
    formato: 'pdf',
    bytes: pdfBytes.length,
  };
};

/**
 * Gera PDF, grava em disco, regista anexo versionado e entrada em processo_relatorios.
 * Ignora gravação se o conteúdo for idêntico ao último relatório.
 */
exports.gerarEGravar = async (processoId, user, options = {}) => {
  const processo = await processosRepository.findById(processoId);
  if (!processo) throw new Error('Processo nao encontrado');

  const anomalias = await resultadosGeneticosRepository.findByProcesso(processoId);
  const pdfBytes = await pdfService.gerarRelatorioNiptPdf({ processo, anomalias });

  return gravarPdfNoProcesso(processoId, pdfBytes, user, options);
};

/** Grava PDF já gerado no browser (pré-visualização html2pdf). */
exports.gravarPdfBuffer = async (processoId, pdfBytes, user, options = {}) =>
  gravarPdfNoProcesso(processoId, pdfBytes, user, options);

exports.listarRelatoriosProcesso = async (processoId) => {
  const anexos = await anexosRepository.findByProcesso(processoId);
  return anexos.filter(isRelatorioAnexo);
};

exports.RELATORIOS_DIR = RELATORIOS_DIR;
