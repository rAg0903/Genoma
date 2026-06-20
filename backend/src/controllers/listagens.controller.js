const listagensService = require('../services/listagens.service');
const exportService = require('../services/export.service');

exports.list = async (req, res) => {
  try {
    const result = await listagensService.getListing(req.params.listing, req.query, req.user);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.search = async (req, res) => {
  try {
    const result = await listagensService.search(req.query.q || '', req.user);
    res.json({ data: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.export = async (req, res) => {
  try {
    const format = String(req.query.format || 'csv').toLowerCase();
    const { data, columns, label } = await listagensService.getFullListing(req.params.listing, req.query, req.user);
    const safe = (label || req.params.listing).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_').toLowerCase();
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `${safe}_${stamp}`;

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      return res.send(exportService.toCSV({ columns, rows: data }));
    }
    if (format === 'xlsx' || format === 'excel') {
      const buffer = await exportService.toXLSX({ columns, rows: data, label });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
      return res.send(Buffer.from(buffer));
    }
    if (format === 'pdf' || format === 'html') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(exportService.toHTML({ columns, rows: data, label }));
    }
    return res.status(400).json({ error: 'Formato invalido. Use csv, xlsx ou pdf.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
