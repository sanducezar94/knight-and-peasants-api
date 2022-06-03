const fs = require('fs');
const fsPromises = fs.promises;
const axios = require('axios');

const collectionEndpoints = (app) => {
  app.get('/api/collectionData', async function (req, res, next) {
    try {
      fs.readFile('./stats/collectionData.json', async (err, data) => {
        let jsonData = JSON.parse(data);
        return res.send({
          data: jsonData.uniqueHolder
        });
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/api/getCollectionMetadata', async function (req, res, next) {
    try {
      let collectionName = req.query["collectionName"];
      const fileBytes = await fsPromises.readFile(`./data/metadata/${collectionName}.json`);
      return res.send({
        data: JSON.parse(fileBytes)
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send('Internal Error');
    }
  });

  app.get('/api/accountInfo', async function (req, res, next) {
    try {
      const account = req.query.account.toLowerCase();

      const data = await axios.post('https://graph.knightsandpeasants.one/tokens', {
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        },
        referrerPolicy: 'no-referrer',
        query: `
            {
              accountBalances(where: {account: "${account}"}) {
                amount
                token {
                  id
                  name
                }
              }
              accountInventories(where: {account: "${account}"}) {
                asset {
                  id
                  name
                }
              }
              nftItems(where: {owner: "${account}"}) {
                  id
                  tokenId
                  tokenUri
                }
              }
          `
      });

      const returnData = {
        accountBalances: data.data.data.accountBalances,
        accountInventories: data.data.data.accountInventories,
        nftItems: data.data.data.nftItems
      }

      return res.status(200).send(returnData);

    } catch (err) {
      console.log(err);
      return res.status(500).send('Internal Error');
    }
  });
}

module.exports = collectionEndpoints;