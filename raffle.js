const express = require('express');
const fs = require('fs');
const fsPromises = fs.promises;
const PeasantNFT = require('./artifacts/peasants.json')

const app = express();
const Web3 = require('web3');

const chainKey = 'mainnet';
const provider = chainKey === 'testnet' ? 'https://api.s0.b.hmny.io' : 'https://rpc.cosmicuniverse.one/';

const web3 = new Web3(new Web3.providers.HttpProvider(provider));
const ERC721 = new web3.eth.Contract(PeasantNFT.abi, "0x450ec80261466c636aCbFc557e765dddCC4c8946"); 

const multicall = require('@dopex-io/web3-multicall');
const multicallContract = new multicall({
    multicallAddress: chainKey === 'testnet' ? "0x7Fa439F7e7D54ae2383D8237bA066F83C27706A5" : "0xcA11bde05977b3631167028862bE2a173976CA11",
    chainId: chainKey === 'testnet' ? 1666700000 : 1666600000,
    provider: web3
});

const getUniqueHolders = async () => {
    const knights = require('./data/knightSnapshot.json');

    const kk = {};
    for(let i = 0; i < knights.length; i++){
        kk[knights[i]] = 0;
    }

    for(let i = 0; i < knights.length; i++){
        kk[knights[i]] ++;
    }

    await fsPromises.writeFile('./data/kk.json', JSON.stringify(kk));
}

const getMax = async() => {
    const addy = require('./data/kk.json');

    const keys = Object.keys(addy);
    let total = 0;
    for(let i = 0; i < keys.length; i++){
        const key = keys[i];
        if(addy[key] <= 3) {
            total += 1;
            continue;
        }
        total += Math.min(parseInt(addy[key] / 3), 40)
    }

    console.log(total);
}

const getKnightUniqueHolders = async (contract, multicallContract) => {
    const BATCH_SIZE = 200;
    let calls = [];
    let results = [];
    const currentSupply = await contract.methods.totalSupply().call();

    for (let i = 0; i < currentSupply; i += 1) {
        calls.push(contract.methods.ownerOf(i));

        if (i % BATCH_SIZE >= BATCH_SIZE - 1 || i === currentSupply - 1) {
            console.log(i);
            results.push(...await multicallContract.aggregate(calls));
            calls = [];
        }
    }
    

    /*let uniqueHolders = [];

    for(let i = 0; i < 5000; i++){
        if(uniqueHolders.indexOf(results[i]) > -1) continue;

        uniqueHolders.push(results[i]);
    }

   / let winners = getRandom(uniqueHolders, 25);*/
    
    await fsPromises.writeFile('./data/raffle.json', JSON.stringify(results));
} 

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

setTimeout(async () => {
    console.log(await  getMax());
}, 1000);


app.listen(8001, function () {
    console.log('API running on port 8001');
});