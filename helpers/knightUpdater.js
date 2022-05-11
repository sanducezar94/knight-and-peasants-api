const fs = require('fs');
const fsPromises = fs.promises;

function updateTrait(nft, attribute) {
    let attr = nft.attributes.filter(c => c.trait_type === attribute.trait_type)[0];
    if (!attr) {
        attr = {
            "trait_type": attribute.trait_type,
            "value": attribute.value
        };
        nft.attributes.push(attr);
        return;
    };

    attr.value = attribute.value;
}

const updateMetadataFromContract = async function updateMetadataFromContract(contract, multicallContract) {
    const BATCH_SIZE = 200;

    const metadataBytes = await fsPromises.readFile('./data/metadata/knights.json');
    const metadata = JSON.parse(metadataBytes);

    const currentSupply = 200;

    let calls = [];
    let results = [];

    for (let i = 0; i < currentSupply; i += 1) {
        calls.push(contract.methods.getTokenAttributes(i));

        if (i % BATCH_SIZE >= BATCH_SIZE - 1 || i === currentSupply - 1) {
            results.push(...await multicallContract.aggregate(calls));
            calls = [];
        }
    }

    for (let i = 0; i < results.length; i++) {
        let nft = metadata.filter(c => c.tokenId == results[i].tokenId)[0];
        const knightNft = results[i];

        if (!nft) continue;

        if (!nft) {
            nft = {
                "tokenId": i,
                "name": `Knight #${i}`,
                "description": "A collection with 5000 unique Knights which can be used in the Knights & Peasants ecosystem.",
                "external_url": "",
                "image": `https://api.knightsandpeasants.one/images/knight?id=${i}`,
                "attributes": []
            };
            metadata.push(nft);
        };

        updateTrait(nft, {
            "trait_type": "Income",
            "value": parseInt(Math.min(26, knightNft.speed))
        });
        updateTrait(nft, {
            "trait_type": "Training Camp",
            "value": parseInt(knightNft.camp)
        });
        updateTrait(nft, {
            "trait_type": "Weapons Mastery",
            "value": parseInt(knightNft.weaponsMastery)
        });
        updateTrait(nft, {
            "trait_type": "Armor Mastery",
            "value": parseInt(knightNft.armourMastery)
        });
        updateTrait(nft, {
            "trait_type": "Horse Mastery",
            "value": parseInt(knightNft.horseMastery)
        });
        updateTrait(nft, {
            "trait_type": "Chivalry Mastery",
            "value": parseInt(knightNft.chivalryMastery)
        });
        
    }

    await fsPromises.writeFile('./data/metadata/knights.json', JSON.stringify(metadata));
}

module.exports = updateMetadataFromContract;