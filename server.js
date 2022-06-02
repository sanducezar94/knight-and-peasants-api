const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fsPromises = fs.promises;
const bodyParser = require("body-parser");
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());

require('./routes/knights')(app);
require('./routes/peasants')(app);
require('./routes/bags')(app);

// functions used in endpoints
var knightMetadata = [];
var peasantMetadata = [];
var itemList = ['purses'];
var itemMetadata = {
  purses: []
};

async function fetchMetadata() {
  const knightMetadataBytes = await fsPromises.readFile('./data/metadata/knights.json');
  knightMetadata = JSON.parse(knightMetadataBytes);

  const peasantMetadataBytes = await fsPromises.readFile('./data/metadata/peasants.json');
  peasantMetadata = JSON.parse(peasantMetadataBytes);

  itemList.forEach(async (item) => {
    const itemMetadataBytes = await fsPromises.readFile(`./data/metadata/${item}.json`);
    itemMetadata[item] = JSON.parse(itemMetadataBytes);
  });
}

setInterval(async () => {
  await fetchMetadata();
}, 1000 * 3600 * 0.11);

setTimeout(async () => {
  await fetchMetadata();
}, 100);

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

app.listen(8000, async function () {
  await fetchMetadata();
  console.log('API running on port 8000');
});