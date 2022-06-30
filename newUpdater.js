const express = require('express');

const TrainingCamp = require('./artifacts/trainingCamp.json');
const CoinPurse = require('./artifacts/coinPurse.json');
const PeasantNFT = require('./artifacts/peasants.json')

const app = express();
const Web3 = require('web3');

const chainKey = 'mainnet';
const provider = chainKey === 'testnet' ? 'https://api.s0.b.hmny.io' : 'https://api.s0.t.hmny.io/';

const web3 = new Web3(new Web3.providers.HttpProvider(provider));
const campContract = new web3.eth.Contract(TrainingCamp.abi, TrainingCamp[chainKey]);
const coinPurseContract = new web3.eth.Contract(CoinPurse.abi, CoinPurse[chainKey]);
const peasantContract = new web3.eth.Contract(PeasantNFT.abi, PeasantNFT[chainKey]); 

const multicall = require('@dopex-io/web3-multicall');
const multicallContract = new multicall({
    multicallAddress: chainKey === 'testnet' ? "0x7Fa439F7e7D54ae2383D8237bA066F83C27706A5" : "0xcA11bde05977b3631167028862bE2a173976CA11",
    chainId: chainKey === 'testnet' ? 1666700000 : 1666600000,
    provider: web3
});

const statCollector = require('./helpers/statCollector.js');
const peasantUpdater = require('./helpers/peasantUpdater');
const purseUpdater = require('./helpers/purseUpdater');
const knightUpdater = require('./helpers/knightUpdater');


const service = setInterval(async () => {
    try {
        console.log("Updating peasant data...");
        await peasantUpdater(peasantContract, multicallContract);
        console.log("Peasant data updated...");

        console.log("Updating purse data...");
        await purseUpdater(coinPurseContract, multicallContract);
        console.log("Coin purses updated.");

        console.log("Updating knight data...");
        await knightUpdater(campContract, multicallContract);
        console.log("Knight data updated.");

        console.log("Fetching collection data...");
        await statCollector();
        console.log("Collection data updated.");

    } catch (error) {
        console.log(error);
    }

}, 1000 * 3600 * 0.1);

// INITIATE AN UPDATE WHEN THE SERVER IS STARTING
setTimeout(async () => {
    try {
        console.log("Updating peasant data...");
        await peasantUpdater(peasantContract, multicallContract);
        console.log("Peasant data updated...");

        console.log("Updating purse data...");
        await purseUpdater(coinPurseContract, multicallContract);
        console.log("Coin purses updated.");

        console.log("Updating knight data...");
        await knightUpdater(campContract, multicallContract);
        console.log("Knight data updated.");

        console.log("Fetching collection data...");
        await statCollector();
        console.log("Collection data updated.");

    } catch (error) {
        console.log(error);
    }
}, 1000);


app.listen(8001, function () {
    console.log('API running on port 8001');
});