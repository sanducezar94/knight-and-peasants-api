const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

const knightEndpoints = (app) => {
  let metadata = [];

  async function initializeMetadata() {
    const metadataBytes = await fsPromises.readFile('./data/metadata/knights.json');
    metadata = JSON.parse(metadataBytes);
  }
  
  //INITIALIZE
  initializeMetadata();

  setInterval(async function() {
    const metadataBytes = await fsPromises.readFile('./data/metadata/knights.json');
    metadata = JSON.parse(metadataBytes);
  }, 300 * 1000);
  
  async function getMetadataFromDatabase(id) {
    let data = {
      tokenId: -1
    };

    for (let i = 0; i < metadata.length; i++) {
      if (metadata[i].tokenId == id) {
        return metadata[i];
      }
    }
  
    return data;
  }

  //

  app.get('/images/knight/:old?', async function (req, res, next) {
    try {
      let id = parseInt(req.query["id"]);
      const totalSupply = 5000; //await contract.methods.totalSupply().call();

      if (totalSupply > id) {
        return res.set({
          'Cache-Control': 'max-age=31536000'
        }).sendFile(path.join(__dirname + "../../data/images_new/" + id + ".jpg"));
      } else {
        return res.status(500).send('Not yet minted');
      }
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/images/smallKnight/', async function (req, res, next) {
    try {
      let id = parseInt(req.query["id"]);
      const totalSupply = 5000; //await contract.methods.totalSupply().call();
      if (totalSupply > id) {
        return res.set({
          'Cache-Control': 'max-age=31536000'
        }).sendFile(path.join(__dirname + "../../data/smallerImages_new/small" + id + ".jpg"));
      } else {
        return res.status(500).send('Not yet minted');
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/images/oldKnight/', async function (req, res, next) {
    try {
      let id = parseInt(req.query["id"]);
      const totalSupply = 5000; //await contract.methods.totalSupply().call();

      if (totalSupply > id) {
        return res.set({
          'Cache-Control': 'max-age=31536000'
        }).sendFile(path.join(__dirname + "../../data/images/" + id + ".jpg"));
      } else {
        return res.status(500).send('Not yet minted');
      }
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/images/oldSmallKnight/', async function (req, res, next) {
    try {
      let id = parseInt(req.query["id"]);
      const totalSupply = 5000; //await contract.methods.totalSupply().call();
      if (totalSupply > id) {
        return res.set({
          'Cache-Control': 'max-age=31536000'
        }).sendFile(path.join(__dirname + "../../data/smallerImages/small" + id + ".jpg"));
      } else {
        return res.status(500).send('Not yet minted');
      }
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });

  // takes a collection of ids and returns them all together
  app.get('/api/knights', async function (req, res, next) {
    try {
      const knightsIds = req.query.items
      let metaList = []
      let requestIds = knightsIds.split(',');

      const totalSupply = 5000; //await contract.methods.totalSupply().call();


      for (let i = 0; i < requestIds.length; i++) {
        const id = requestIds[i];
        let idInt = parseInt(id);
        if (totalSupply > idInt) {
          let meta = await getMetadataFromDatabase(idInt);
          metaList.push(meta);
        }
      }

      return res.send({
        data: metaList
      });
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/api/knightUpgrades', async function (req, res, next) {
    try {
      fs.readFile('./stats/newStats.json', async (err, data) => {
        let jsonData = JSON.parse(data);
        return res.send({
          data: jsonData
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/api/knight', async function (req, res, next) {
    try {
      const knightId = parseInt(req.query.id)
      let id = parseInt(knightId);
      let meta = await getMetadataFromDatabase(id);

      return res.send(meta);
    } catch (err) {
      return res.status(500).send('Internal Error');
    }
  });
};


module.exports = knightEndpoints;