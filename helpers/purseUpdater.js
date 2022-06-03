const fs = require('fs');
const fsPromises = fs.promises;

const purseSizes = [10, 50, 100, 250, 500, 1000, 2500, 5000];
const purseMappings = {
    "0x5a9ac6c271653dc5660ae90e8ecf1401164a2690": "Farmer",
    "0x9aa6715bfa11e5bd63af420f480c758c7038e08a": "Alchemist",
}

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

    const metadataBytes = await fsPromises.readFile('./data/metadata/purses.json');
    const metadata = JSON.parse(metadataBytes);

    const currentSupply = await contract.methods.pursesCreated().call();
    const lastIndex = metadata.length > 0 ? metadata[metadata.length - 1].tokenId : 0;

    let calls = [];
    let results = [];

    console.log("Bags supply", currentSupply);

    for (let i = lastIndex; i < currentSupply; i += 1) {
        calls.push(contract.methods.getPurseContent(i));

        if (i % BATCH_SIZE >= BATCH_SIZE - 1 || i === currentSupply - 1) {
            results.push(...await multicallContract.aggregate(calls));
            calls = [];
        }
    }

    for (let i = 0; i < results.length; i++) {
        let nft = metadata.filter(c => c.tokenId == i)[0];
        let purseData = results[i];

        const purseSize = purseSizes[purseData.purseSize];
        const wageName = purseMappings[purseData.wageAddress.toLowerCase()];

        if (!nft) {
            nft = {
                "tokenId": i,
                "name": `Purse #${i}`,
                "description": `A purse containing ${purseSize} x${wageName} tokens.`,
                "external_url": "",
                "image": `https://api.knightsandpeasants.one/images/bags?id=${i}`,
                "attributes": []
            };
            metadata.push(nft);
        };

        updateTrait(nft, {
            "trait_type": "Purse Size",
            "value": purseSize.toString()
        });
        updateTrait(nft, {
            "trait_type": "Wage Token",
            "value": wageName
        });
        updateTrait(nft, {
            "trait_type": "Size Id",
            "value": parseInt(purseData.purseSize)
        });
    }

    await fsPromises.writeFile('/data/metadata/purses.json', JSON.stringify(metadata));
}

module.exports = updateMetadataFromContract;