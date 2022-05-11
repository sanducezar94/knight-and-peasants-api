const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fsPromises = fs.promises;
const bodyParser = require("body-parser");


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());

// functions used in endpoints
var knightMetadata = [];
var peasantMetadata = [];
var itemList = ['purses'];
var itemMetadata = { 
  purses: []
};

async function fetchMetadata(){
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

async function getMetadataFromDatabase(metadata, id) {
  let data = {tokenId: -1};
  for (let i = 0; i < metadata.length; i++) {
    if (metadata[i].tokenId == id) {
        data = metadata[i];
        break;
    }
  }

  return data;
}

app.get('/images/knight/:old?', async function(req, res, next) {
    try{
        let id = parseInt(req.query["id"]);
        const totalSupply = 5000; //await contract.methods.totalSupply().call();
      
        if (totalSupply > id) {
          return res.set({'Cache-Control': 'max-age=31536000'}).sendFile(__dirname + "/data/images_new/" + id + ".jpg");      
        } else {
          return res.status(500).send('Not yet minted');
        }
    }
    catch(err){
        return res.status(500).send('Internal Error');
    }
});

app.get('/images/smallKnight/', async function(req, res, next) {
    try{
        let id = parseInt(req.query["id"]);       
        const totalSupply = 5000; //await contract.methods.totalSupply().call();
        if (totalSupply > id) {
          return res.set({'Cache-Control': 'max-age=31536000'}).sendFile(__dirname + "/data/smallerImages_new/small" + id + ".jpg");     
        } else {
          return res.status(500).send('Not yet minted');
        }
    }
    catch(err){
        return res.status(500).send('Internal Error');
    }
});

app.get('/images/oldKnight/', async function(req, res, next) {
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

app.get('/images/oldSmallKnight/', async function(req, res, next) {
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
        let meta = await getMetadataFromDatabase(knightMetadata, idInt);
        metaList.push(meta);
      }
    }
  
    return res.send({data: metaList});
  }
  catch(err){
    return res.status(500).send('Internal Error');
  }
});

// takes a collection of ids and returns them all together
app.get('/api/peasants', async function (req, res, next) {
  try{
    const knightsIds = req.query.items
    let metaList = []
    let requestIds = knightsIds.split(',');

    for(let i = 0; i < requestIds.length; i++){
      const id = requestIds[i];
      let idInt = parseInt(id);
      let meta = await getMetadataFromDatabase(peasantMetadata, idInt);
      metaList.push(meta);
    }
  
    return res.send({data: metaList});
  }
  catch(err){
    return res.status(500).send('Internal Error');
  }
});

// takes a collection of ids and returns them all together
app.get('/api/purses', async function (req, res, next) {
  try{
    const knightsIds = req.query.items
    let metaList = []
    let requestIds = knightsIds.split(',');

    for(let i = 0; i < requestIds.length; i++){
      const id = requestIds[i];
      let idInt = parseInt(id);
      let meta = await getMetadataFromDatabase(itemMetadata["bags"], idInt);
      metaList.push(meta);
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

app.get('/api/knightUpgrades', async function (req, res, next) {
  try{
    fs.readFile('./stats/newStats.json', async (err, data) => {
        let jsonData = JSON.parse(data);
        return res.send({data: jsonData});
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

app.get('/api/knight', async function (req, res, next) {
    try{
      const knightId = req.query.id
      const totalSupply = 5000; //await contract.methods.totalSupply().call();

      let id = parseInt(knightId);
      

      if (totalSupply > id) {
        let meta = await getMetadataFromDatabase(knightMetadata, id);
        return res.send({data: meta});
      } else {
        return res.status(500).send('Not yet minted');
      }
    }
    catch(err){
        return res.status(500).send('Internal Error');
    }
  });

app.listen(8000, async function() {
  await fetchMetadata();
  console.log('API running on port 8000');
});
