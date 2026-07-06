require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const kitAutoDescarte = require('../services/kit-auto-descarte.service');

kitAutoDescarte.processPendingAutoDescartes()
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.errors.length ? 1 : 0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
