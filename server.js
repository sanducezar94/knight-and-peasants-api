const express = require('express');
const cors = require('cors');
const fs = require('fs');

const KnightNFT = require('./artifacts/knights.json');
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://api.s0.b.hmny.io/'));

const contract = new web3.eth.Contract(KnightNFT.abi, KnightNFT.address);

// functions used in endpoints
const metadata = require("./data/api_metadata_new.json");

async function getMetadataFromDatabase(id) {
  let data = {};
  for (let i = 0; i < metadata.length; i++) {
    if (metadata[i].tokenId == id) {
        data = metadata[i];
        break;
    }
  }

  return data;
}

app.get('/images/knight', async function(req, res, next) {
    try{
        let id = parseInt(req.query["id"]);
        const totalSupply = 5000; //await contract.methods.totalSupply().call();
      
        if (totalSupply > id) {
          return res.set({'Cache-Control': 'max-age=31536000'}).sendFile(__dirname + "/data/images/" + id + ".jpg");
        } else {
          return res.status(500).send('Not yet minted');
        }
    }
    catch(err){
        return res.status(500).send('Internal Error');
    }
});

app.get('/images/smallKnight', async function(req, res, next) {
    try{
        let id = parseInt(req.query["id"]);        
        const totalSupply = 5000; //await contract.methods.totalSupply().call();
        if (totalSupply > id) {
          return res.set({'Cache-Control': 'max-age=31536000'}).sendFile(__dirname + "/data/smallerImages/small" + id + ".jpg");
        } else {
          return res.status(500).send('Not yet minted');
        }
    }
    catch(err){
        return res.status(500).send('Internal Error');
    }
});


// takes a collection of ids and returns them all together
app.get('/api/knights', async function (req, res, next) {
  try{
    const knightsIds = req.query.items
    let metaList = []
    let requestIds = knightsIds.split(',');

    const totalSupply = 5000; //await contract.methods.totalSupply().call();


    for(let i = 0; i < requestIds.length; i++){
      const id = requestIds[i];
      let idInt = parseInt(id);
      if (totalSupply > idInt) {
        let meta = await getMetadataFromDatabase(idInt);
        metaList.push(meta);
      }
    }
  
    return res.send({data: metaList});
  }
  catch(err){
    return res.status(500).send('Internal Error');
  }
});

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

app.get('/api/knight', async function (req, res, next) {
    try{
      const knightId = req.query.id
      const totalSupply = 5000; //await contract.methods.totalSupply().call();

      let id = parseInt(knightId);

      if (totalSupply > id) {
        let meta = await getMetadataFromDatabase(id);
        return res.send({data: meta});
      } else {
        return res.status(500).send('Not yet minted');
      }
    }
    catch(err){
        return res.status(500).send('Internal Error');
    }
  });


app.listen(8000, function() {
  console.log('API running on port 8000');
});
