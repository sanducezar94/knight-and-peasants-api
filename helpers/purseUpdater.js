const fs = require('fs');
const fsPromises = fs.promises;

const purseSizes = [10, 50, 100, 250, 500, 1000, 2500, 5000];
const purseMappings = {
    "0x4e0c9ff0fb128eb4f99ec6f8b206155c5a86de44": "xFarmer",
    "0x78e568b6fc90487a576e65d74b9530da7b5e2949": "xAlchemist",
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
                "description": `A purse containing ${purseSize} ${wageName} tokens.`,
                "external_url": "",
                "image": `${purseData.purseSize}.png`,
                "attributes": []
            };
            metadata.push(nft);
        };

        updateTrait(nft, {
            "trait_type": "Purse Size",
            "value": purseSize
        });
        updateTrait(nft, {
            "trait_type": "Wage Token",
            "value": wageName
        });
    }

    fs.writeFile('./data/metadata/purses.json', JSON.stringify(metadata), function (err) {
        if (err) return console.log(err);
    });
}

module.exports = updateMetadataFromContract;