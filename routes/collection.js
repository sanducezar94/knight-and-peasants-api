const path = require('path');

const collectionEndpoints = (app) => {

    app.get('/api/collectionData', async function (req, res, next) {
        try{
          fs.readFile('./stats/collectionData.json', async (err, data) => {
              let jsonData = JSON.parse(data);
              return res.send({data: jsonData.uniqueHolder});
          });
        }
        catch(err){
          console.log(err);
          return res.status(500).send('Internal Error');
        }
      });
      
      app.get('/api/getCollectionMetadata', async function (req, res, next) {
        try{
          let collectionName = req.query["collectionName"];  
          const fileBytes = await fsPromises.readFile(`./data/metadata/${collectionName}.json`);
          return res.send({data: JSON.parse(fileBytes)});
        }
        catch(err){
          console.log(err);
          return res.status(500).send('Internal Error');
        }
      });

}

module.exports = collectionEndpoints;