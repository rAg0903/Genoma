const faturacaoService = require('../services/faturacao.service');
const pdfService = require('../services/pdf.service');
const processosRepository = require('../repositories/processos.repository');
const empresasRepository = require('../repositories/empresas.repository');

exports.get = async (req, res) => {
  try {
    const faturacao = await faturacaoService.getFaturacao(req.params.id, req.user);
    res.json({ data: faturacao });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.emitir = async (req, res) => {
  try {
    const faturacao = await faturacaoService.emitirFatura(req.params.id, req.body, req.user);
    res.status(201).json({ message: 'Fatura emitida com sucesso', data: faturacao });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.registarPagamento = async (req, res) => {
  try {
    const faturacao = await faturacaoService.registarPagamento(req.params.id, req.body, req.user);
    res.json({ message: 'Pagamento registado com sucesso', data: faturacao });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.downloadPdf = async (req, res) => {
  try {
    const processo = await processosRepository.findById(req.params.id);
    if (!processo) return res.status(404).json({ error: 'Processo nao encontrado' });

    if (!processo.fatura_emitida) {
      return res.status(400).json({ error: 'Fatura ainda nao foi emitida para este processo' });
    }

    const faturacao = await faturacaoService.getFaturacao(req.params.id, req.user);

    let empresa = {};
    if (processo.empresa_id) {
      empresa = (await empresasRepository.findById(processo.empresa_id)) || {};
    }

    const pdfBuffer = await pdfService.gerarFaturaPdf({ processo, faturacao, empresa });

    const filename = `fatura_${processo.numero || processo.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
