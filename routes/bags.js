const path = require('path');

const bagsEndpoints = (app) => {
  // takes a collection of ids and returns them all together

  app.get('/images/bags', async function (req, res, next) {
    try {
      const size = parseInt(req.query["size"]);
      const type = req.query["type"];

      return res.set({
        'Cache-Control': 'max-age=31536000'
      }).sendFile(path.join(__dirname + `../../data/images/bags/${type}/${size}.png`));
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });
}


module.exports = bagsEndpoints;