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

const updateTraitRarity = function(traitRarityList, trait_value) {
    const key = trait_value.replace(' ', '');
    traitRarityList[key].count += 1
}

const updateMetadataFromContract = async function updateMetadataFromContract(contract, multicallContract) {
    const BATCH_SIZE = 200;

    const metadataBytes = await fsPromises.readFile('./data/metadata/knights.json');
    const metadata = JSON.parse(metadataBytes);

    const traitRarityBytes = await fsPromises.readFile('./data/rarity/knights_traits.json');
    let traitRarityList = JSON.parse(traitRarityBytes);
    const traitKeys = Object.keys(traitRarityList);

    traitKeys.forEach((key, index) => {
        if(index < 45) return;
        traitRarityList[key] = {
            count: 0,
            percentage: 0
        };
    });

    const currentSupply = 5000;

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
        updateTraitRarity(traitRarityList, `Income${Math.min(26, knightNft.speed)}`);

        updateTrait(nft, {
            "trait_type": "Training Camp",
            "value": parseInt(knightNft.camp)
        });
        updateTraitRarity(traitRarityList, `Training Camp${knightNft.camp}`);

        updateTrait(nft, {
            "trait_type": "Weapons Mastery",
            "value": parseInt(knightNft.weaponsMastery)
        });
        updateTraitRarity(traitRarityList, `Weapons Mastery${knightNft.weaponsMastery}`);

        updateTrait(nft, {
            "trait_type": "Armor Mastery",
            "value": parseInt(knightNft.armourMastery)
        });
        updateTraitRarity(traitRarityList, `Armor Mastery${knightNft.armourMastery}`);

        updateTrait(nft, {
            "trait_type": "Horse Mastery",
            "value": parseInt(knightNft.horseMastery)
        });
        updateTraitRarity(traitRarityList, `Horse Mastery${knightNft.horseMastery}`);

        updateTrait(nft, {
            "trait_type": "Chivalry Mastery",
            "value": parseInt(knightNft.chivalryMastery)
        });
        updateTraitRarity(traitRarityList, `Chivalry Mastery${knightNft.chivalryMastery}`);
        
    }

    traitKeys.forEach((key, index) => {
        if(index < 45) return;
        traitRarityList[key].percentage = (traitRarityList[key].count / currentSupply).toFixed(3);
    });

    await fsPromises.writeFile('./data/metadata/knights.json', JSON.stringify(metadata));
    await fsPromises.writeFile('./data/rarity/knights_traits.json', JSON.stringify(traitRarityList));
    await updateRarity(traitRarityList, metadata);
}

async function updateRarity(traitRarityList, metadata){
    let rarities = {};
    let keys = Object.keys(traitRarityList);
    let rarityList = [];
    
    //skip over dynamic metadata
    for(let i = 0; i < metadata.length; i++){
        let rarityScore = 0;
        for(let j = 6; j < metadata[i].attributes.length; j++){
            const attributeKey = metadata[i].attributes[j].trait_type.replaceAll(' ', '') +  metadata[i].attributes[j].value.replaceAll(' ', '');
            rarityScore += 1 / parseFloat(traitRarityList[attributeKey].percentage);
        }

        rarityList.push({
            tokenId: metadata[i].tokenId,
            rarityScore: rarityScore
        });
    }

    rarityList = rarityList.sort((a,b) => a.rarityScore > b.rarityScore ? -1 : b.rarityScore > a.rarityScore ? 1 : 0);
    
    for(let i = 0; i < 5000; i++){
        rarities[rarityList[i].tokenId] = i + 1;
    }

    await fsPromises.writeFile('./data/rarity/knights.json', JSON.stringify(rarities), {encoding:'utf8',flag:'w'});
}

module.exports = updateMetadataFromContract;