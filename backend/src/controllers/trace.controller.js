const traceService = require('../services/trace.service');

exports.getTrace = async (req, res) => {
  try {
    const data = await traceService.getTrace(req.query.tipo, req.query.id);
    res.json({ data });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
