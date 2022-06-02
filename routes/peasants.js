const path = require('path');

const peasantEndpoints = (app) => {
  // takes a collection of ids and returns them all together
  app.get('/api/peasants', async function (req, res, next) {
    try {
      const knightsIds = req.query.items
      let metaList = []
      let requestIds = knightsIds.split(',');

      for (let i = 0; i < requestIds.length; i++) {
        const id = requestIds[i];
        let idInt = parseInt(id);
        let meta = await getMetadataFromDatabase(peasantMetadata, idInt);
        metaList.push(meta);
      }

      return res.send({
        data: metaList
      });
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/images/peasants', async function (req, res, next) {
    try {
      const rarity = parseInt(req.query["rarity"]);
      const type = req.query["type"];

      return res.set({
        'Cache-Control': 'max-age=31536000'
      }).sendFile(path.join(__dirname + `../../data/images/peasants/${type}_${rarity}.png`));
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });
}


module.exports = peasantEndpoints;