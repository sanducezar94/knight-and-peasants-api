const express = require('express');
const cors = require('cors');
fs = require('fs');

const KnightNFT = require('./knights.json');
const TrainingCamp = require('./trainingCamp.json');

const app = express();

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('https://api.s0.t.hmny.io'));

const contract = new web3.eth.Contract(KnightNFT.abi, KnightNFT.address);
const multicall = require('@dopex-io/web3-multicall');

const multicallContract = new multicall({
    multicallAddress: "0xcA11bde05977b3631167028862bE2a173976CA11",
    chainId: 1666600000,
    provider: web3
});

//const trainingCampContract = new web3.eth.Contract(TrainingCamp.abi,TrainingCamp.address);

// functions used in endpoints
const metadata = require("./data/api_metadata.json");
const SSTEP = 50;

function getNextChunk(index, step, limit){
  let interval = [];
  if(index + step > limit){
    for(let i = index; i < limit; i++){
      interval.push(i);
    }
    return interval;
  }

  for(let i = index; i < index + step; i++){
    interval.push(i);
  }
  return interval;
}

function updateKnightTrait(knight, attribute){
  let attr = knight.attributes.filter(c => c.trait_type === attribute.trait_type)[0];
  if(!attr) {
    attr = {
      "trait_type": attribute.trait_type,
      "trait_value": attribute.trait_value
    };
  };

  attr.trait_value = attribute.trait_value;
  knight.attributes.push(attr);
}

async function updateKnightMetadata(knights){
  for(let i = 0; i < knights.length; i++){
    let knight = metadata.filter(c => c.tokenId == knights[i].tokenId)[0];

    if(!knight) continue;
    updateKnightTrait(knight, { "trait_type": "Income", "trait_value": Math.min(26, knights[i].speed) });
    updateKnightTrait(knight, { "trait_type": "Training Camp", "trait_value": knights[i].camp });
    updateKnightTrait(knight, { "trait_type": "Weapons Mastery", "trait_value": knights[i].weaponsMastery });
    updateKnightTrait(knight, { "trait_type": "Armor Mastery", "trait_value": knights[i].armourMastery });
    updateKnightTrait(knight, { "trait_type": "Horse Mastery", "trait_value": knights[i].horseMastery });
    updateKnightTrait(knight, { "trait_type": "Chivalry Mastery", "trait_value": knights[i].chivalryMastery });
  }

  fs.writeFile('metadataTest.json', JSON.stringify(metadata), function (err) {
    if (err) return console.log(err);
    console.log('Hello World > helloworld.txt');
  });
}

const service = setTimeout(async () => {
    const STEP = 50;

    const currentSupply = await contract.methods.totalSupply().call();

    try{
        let calls = [];
        let result = [];
        let uniqueOwners = [];

        for(let i = 0; i < currentSupply; i += 1){
            calls.push(contract.methods.ownerOf(i));

            if(i % STEP >= STEP - 1){
               // result.push(...await multicallContract.aggregate(calls));
               // calls = [];
            }
        }
        result.push(...await multicallContract.aggregate(calls));
        uniqueOwners = result.filter((item, i, ar) => ar.indexOf(item) === i);
        console.log("Unique Holders", uniqueOwners.length);

    }
    catch(error){
      console.log(error);
    }


}, 500);

app.listen(8000, function() {
  console.log('API running on port 8000');
});