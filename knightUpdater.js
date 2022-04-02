const express = require('express');
fs = require('fs');

const KnightNFT = require('./artifacts/knights.json');
const TrainingCamp = require('./artifacts/trainingCamp.json');
const Bank = require('./artifacts/bank.json');

const app = express();
const Web3 = require('web3');

const chainKey = 'testnet';
const provider = chainKey === 'testnet' ? 'https://api.s0.b.hmny.io' : 'https://rpc.hermesdefi.io/';

const web3 = new Web3(new Web3.providers.HttpProvider(provider));

const knightContract = new web3.eth.Contract(KnightNFT.abi[chainKey], KnightNFT.address);
const campContract = new web3.eth.Contract(TrainingCamp.abi[chainKey], TrainingCamp.address);
const bankContract = new web3.eth.Contract(Bank.abi[chainKey], Bank.address);

const multicall = require('@dopex-io/web3-multicall');
const multicallContract = new multicall({
    multicallAddress: chainKey === 'testnet' ? "0x7Fa439F7e7D54ae2383D8237bA066F83C27706A5" : "0xcA11bde05977b3631167028862bE2a173976CA11",
    chainId: chainKey === 'testnet' ? 1666700000 : 1666600000,
    provider: web3
});


// functions used in endpoints
const metadata = require("./data/api_metadata.json");
const BATCH_SIZE = 500;

function getNextChunk(index, step, limit) {
    let interval = [];
    if (index + step > limit) {
        for (let i = index; i < limit; i++) {
            interval.push(i);
        }
        return interval;
    }

    for (let i = index; i < index + step; i++) {
        interval.push(i);
    }
    return interval;
}

function updateKnightTrait(knight, attribute) {
    let attr = knight.attributes.filter(c => c.trait_type === attribute.trait_type)[0];
    if (!attr) {
        attr = {
            "trait_type": attribute.trait_type,
            "value": attribute.value
        };
    };

    attr.value = attribute.value;
    knight.attributes.push(attr);
}

async function updateKnightMetadata(knights) {
    for (let i = 0; i < knights.length; i++) {
        let knight = metadata.filter(c => c.tokenId == knights[i].tokenId)[0];

        if (!knight) continue;
        updateKnightTrait(knight, {
            "trait_type": "Income",
            "value": parseInt(Math.min(26, knights[i].speed))
        });
        updateKnightTrait(knight, {
            "trait_type": "Training Camp",
            "value": parseInt(knights[i].camp)
        });
        updateKnightTrait(knight, {
            "trait_type": "Weapons Mastery",
            "value": parseInt(knights[i].weaponsMastery)
        });
        updateKnightTrait(knight, {
            "trait_type": "Armor Mastery",
            "value": parseInt(knights[i].armourMastery)
        });
        updateKnightTrait(knight, {
            "trait_type": "Horse Mastery",
            "value": parseInt(knights[i].horseMastery)
        });
        updateKnightTrait(knight, {
            "trait_type": "Chivalry Mastery",
            "value": parseInt(knights[i].chivalryMastery)
        });
    }

    fs.writeFile('metadataTest.json', JSON.stringify(metadata), function (err) {
        if (err) return console.log(err);
    });
}

const service = setInterval(async () => {

    try {
        console.log("Fetching unique holders...")
        await getUniqueHolders();
        console.log("Finished fetching unique holders.");

        console.log("Fetching bank holders");
        await getBankSnapshots();
        console.log("Finished fetching bank holders")


        console.log("Fetching camp data");
        await getCampData();
        console.log("Finished fetching camp data")

    } catch (error) {
        console.log(error);
    }

}, 1000 * 3600 * 2);

async function getUniqueHolders() {
    try {
        const currentSupply = await knightContract.methods.totalSupply().call();

        let calls = [],
            result = [],
            uniqueOwners = [];

        for (let i = 0; i < currentSupply; i += 1) {
            calls.push(knightContract.methods.ownerOf(i));

            if (i % BATCH_SIZE >= BATCH_SIZE - 1 || i === currentSupply - 1) {
                result.push(...await multicallContract.aggregate(calls));
                calls = [];
            }
        }

        uniqueOwners = result.filter((item, i, ar) => ar.indexOf(item) === i);

        let jsonData = {
            "uniqueHolder": uniqueOwners.length,
            "uniqueHolders": uniqueOwners
        };

        fs.writeFile('./stats/collectionData.json', JSON.stringify(jsonData), function (err) {
            if (err) return console.log(err);
        });

    } catch (error) {
        console.log(error);
    }
}

async function getBankSnapshots() {
    try {
        let bankHolders = [];
        fs.readFile('./stats/collectionData.json', async (err, data) => {
            const jsonFile = JSON.parse(data);
            bankHolders = jsonFile["uniqueHolders"];

            let calls = [],
                results = [];;

            for (let i = 0; i < bankHolders.length; i += 1) {
                calls.push(bankContract.methods.balanceOf(bankHolders[i]));

                if (i % BATCH_SIZE >= BATCH_SIZE - 1 || i === bankHolders.length - 1) {
                    results.push(...await multicallContract.aggregate(calls));
                    calls = [];
                }
            }

            let jsonData = {
                "holders": []
            };

            for (let i = 0; i < bankHolders.length; i++) {
                jsonData.holders.push({
                    "address": bankHolders[i],
                    "amount": results[i] / 10 ** 18
                });
            }

            fs.writeFile('./stats/bankSnapshots.json', JSON.stringify(jsonData), function (err) {
                if (err) return console.log(err);
            });
        });


    } catch (error) {
        console.log(error);
    }
}

async function getCampData() {
    try {
        const currentSupply = await knightContract.methods.totalSupply().call();
        let calls = [],
            results = [];

        for (let i = 0; i < currentSupply; i += 1) {
            calls.push(campContract.methods.getTokenAttributes(i));

            if (i % BATCH_SIZE >= BATCH_SIZE - 1 || i === currentSupply - 1) {
                results.push(...await multicallContract.aggregate(calls));
                calls = [];
            }
        }

        await updateKnightMetadata(results);
    } catch (error) {
        console.log(error);
    }
}

app.listen(8001, function () {
    console.log('API running on port 8001');
});