const path = require('path');

let metadataImage = {};
let metadata = require('../data/metadata/peasants.json');

let timeOut = setInterval(() => {
  initializeMetadata();
}, 300 * 1000);

function initializeMetadata() {
  metadata = require('../data/metadata/peasants.json');
  metadataImage = {};

  for (let i = 0; i < metadata.length; i++) {
    metadataImage[i] = {
      type: metadata[i].attributes[1].value.toLowerCase(),
      rarity: parseInt(metadata[i].attributes[2].value)
    }
  }
}

//INITIALIZE
initializeMetadata();

async function getMetadataFromDatabase(id) {
  let data = {};
  for (var i = 0; i < metadata.length; i++) {
    if (metadata[i].tokenId == id) {
      data = metadata[i];
      break;
    }
  }

  return data;
}

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
        let meta = await getMetadataFromDatabase(idInt);
        metaList.push(meta);
      }

      return res.send({
        data: metaList
      });
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/api/peasant', async function (req, res, next) {
    try {
      const id = parseInt(req.query["id"]);
      let data = await getMetadataFromDatabase(id);

      return res.send({
        data: data
      });
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/images/peasants', async function (req, res, next) {
    try {
      const id = parseInt(req.query['id']);
      const rarity = metadataImage[id].rarity;
      const type = metadataImage[id].type;

      return res.set({
        'Cache-Control': 'max-age=31536000'
      }).sendFile(path.join(__dirname + `../../data/images/peasants/${type}_${rarity}.png`));
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });
}


module.exports = peasantEndpoints;