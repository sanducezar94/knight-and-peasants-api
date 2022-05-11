const fs = require('fs');
const fsPromises = fs.promises;

const peasantProfessions = ["Farmer", "Alchemist", "Blacksmith"];
const peasantRarities = ["Wood", "Iron", "Bronze", "Golden", "Platinum"];
const peasantSkill = ["Novice", "Amateur", "Intermediate", "Master", "Grandmaster"];

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
    const BATCH_SIZE = 500;

    const metadataBytes = await fsPromises.readFile('./data/metadata/peasants.json');
    const metadata = JSON.parse(metadataBytes);

    const currentSupply = await contract.methods.totalSupply().call();

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
                "image": `${professionDisplay.toLowerCase()}_${peasantData[1]}.png`,
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

        updateTrait(nft, {
            "trait_type": "Rarity",
            "value": parseInt(peasantData[1])
        });
        updateTrait(nft, {
            "trait_type": "Rarity Type",
            "value": rarityDisplay
        });

        updateTrait(nft, {
            "trait_type": "Talent",
            "value":  ((parseInt(peasantData[2][0][1]) / 10 ** 18 - 0.9) * 10).toFixed(0)
        });
        updateTrait(nft, {
            "trait_type": "Labour",
            "value": ((parseInt(peasantData[2][1][1]) / 10 ** 18 - 0.9) * 10).toFixed(0)
        });
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
    }

    fs.writeFile('./data/metadata/peasants.json', JSON.stringify(metadata), function (err) {
        if (err) return console.log(err);
    });
}

module.exports = updateMetadataFromContract;