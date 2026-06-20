const codigoPostalService = require('../services/codigo-postal.service.js');

exports.lookup = async (req, res) => {
  try {
    const result = await codigoPostalService.lookup(req.params.cp);
    if (!result) {
      return res.status(404).json({ error: 'Código postal não encontrado' });
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
