const fs = require('fs');
const fsPromises = fs.promises;

const peasantProfessions = ["Farmer", "Alchemist", "Blacksmith", "Hunter"];
const peasantRarities = ["Wood", "Iron", "Bronze", "Gold", "Platinum"];
const peasantSkill = ["Novice", "Amateur", "Advanced", "Competent", "Expert", "Grandmaster"];

function updateTrait(nft, attribute, rarity = false) {
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

const updateTraitRarity = function (traitRarityList, trait_value) {
    const key = trait_value.replace(' ', '');
    if (!traitRarityList[key]) {
        traitRarityList[key] = {
            count: 0,
            percentage: 0
        };
    }
    traitRarityList[key].count += 1
}

const updateMetadataFromContract = async function updateMetadataFromContract(contract, multicallContract) {
    const BATCH_SIZE = 500;

    const metadataBytes = await fsPromises.readFile('./data/metadata/peasants.json');
    const metadata = JSON.parse(metadataBytes);

    const traitRarityBytes = await fsPromises.readFile('./data/rarity/peasants_traits.json');
    let traitRarityList = JSON.parse(traitRarityBytes);
    const traitKeys = Object.keys(traitRarityList);

    traitKeys.forEach((key) => {
        traitRarityList[key] = {
            count: 0,
            percentage: 0
        };
    });

    const currentSupply = await contract.methods.totalSupply().call();

    console.log("PEASANT SUPPLY", currentSupply);

    let calls = [];
    let results = [];

    for (let i = 0; i < currentSupply; i += 1) {
        calls.push(contract.methods.getData(i));

        if (i % BATCH_SIZE >= BATCH_SIZE - 1 || i === currentSupply - 1) {
            results.push(...await multicallContract.aggregate(calls));
            calls = [];
        }
    }

    for (let i = 0; i < results.length; i++) {
        let nft = metadata.filter(c => c.tokenId == i)[0];
        let peasantData = results[i];

        const professionDisplay = peasantProfessions[peasantData[0]];
        const rarityDisplay = peasantRarities[peasantData[1]];
        const skillDisplay = peasantSkill[peasantData[2][3][1]];

        if (!nft) {
            nft = {
                "tokenId": i,
                "name": `Peasant #${i}`,
                "description": `A ${rarityDisplay} ${skillDisplay} ${professionDisplay} peasant.`,
                "external_url": "",
                "image": `https://api.knightsandpeasants.one/images/peasants?id=${i}`,
                "attributes": []
            };
            metadata.push(nft);
        };

        updateTrait(nft, {
            "trait_type": "Profession",
            "value": parseInt(peasantData[0])
        });
        updateTrait(nft, {
            "trait_type": "Profession Name",
            "value": professionDisplay
        });
        updateTraitRarity(traitRarityList, `ProfessionName${professionDisplay}`);

        updateTrait(nft, {
            "trait_type": "Rarity",
            "value": parseInt(peasantData[1])
        });
        updateTrait(nft, {
            "trait_type": "Rarity Type",
            "value": rarityDisplay
        });
        updateTraitRarity(traitRarityList, `RarityType${rarityDisplay}`)

        const talent = ((parseInt(peasantData[2][0][1]) / 10 ** 18 - 0.9) * 10).toFixed(0);
        updateTrait(nft, {
            "trait_type": "Talent",
            "value": ((parseInt(peasantData[2][0][1]) / 10 ** 18 - 0.9) * 10).toFixed(0)
        });
        updateTraitRarity(traitRarityList, `Talent${talent}`);

        const labour = ((parseInt(peasantData[2][1][1]) / 10 ** 18 - 0.9) * 10).toFixed(0)
        updateTrait(nft, {
            "trait_type": "Labour",
            "value": labour
        });
        updateTraitRarity(traitRarityList, `Labour${labour}`);

        updateTrait(nft, {
            "trait_type": "Experience",
            "value": parseInt(peasantData[2][2][1])
        });

        updateTrait(nft, {
            "trait_type": "Skill",
            "value": parseInt(peasantData[2][3][1])
        });

        updateTrait(nft, {
            "trait_type": "Skill Name",
            "value": skillDisplay
        });
        updateTraitRarity(traitRarityList, `SkillName${skillDisplay}`);
    }

    traitKeys.forEach((key) => {
        traitRarityList[key].percentage = (traitRarityList[key].count / currentSupply).toFixed(3);
    });

    await fsPromises.writeFile('./data/metadata/peasants.json', JSON.stringify(metadata));
    await fsPromises.writeFile('./data/rarity/peasants_traits.json', JSON.stringify(traitRarityList));
    await updateRarity(traitRarityList, metadata);
}

async function updateRarity(traitRarityList, metadata) {
    let rarities = {};
    let rarityList = [];

    const attributeList = ['Rarity Type', 'Profession Name', 'Labour', 'Talent'];

    //skip over dynamic metadata
    for (let i = 0; i < metadata.length; i++) {
        let rarityScore = 0;
        let attributes = metadata[i].attributes.filter(c => attributeList.indexOf(c.trait_type) > -1);

        for (let j = 0; j < attributes.length; j++) {
            const attributeKey = attributes[j].trait_type.replaceAll(' ', '') + attributes[j].value.replaceAll(' ', '');
            const multiplier = 1;
            
            if(attributes[j] === 'Rarity Type'){
                multiplier = 2;
            }
            rarityScore += multiplier * (1 / parseFloat(traitRarityList[attributeKey].percentage));
        }

        rarityList.push({
            tokenId: metadata[i].tokenId,
            rarityScore: rarityScore
        });
    }

    rarityList = rarityList.sort((a, b) => a.rarityScore > b.rarityScore ? -1 : b.rarityScore > a.rarityScore ? 1 : 0);

    for (let i = 0; i < metadata.length; i++) {
        rarities[rarityList[i].tokenId] = i + 1;
    }

    await fsPromises.writeFile('./data/rarity/peasants.json', JSON.stringify(rarities), {encoding:'utf8',flag:'w'});
}


module.exports = updateMetadataFromContract;