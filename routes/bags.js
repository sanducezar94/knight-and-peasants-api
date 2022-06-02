const path = require('path');


let metadata = require('../data/metadata/purses.json');
let metadataImage = {};

let timeOut = setInterval(() => {
    metadata = require('../data/metadata/purses.json');

    for(let i = 0; i < metadata.length; i++){
        metadataImage[i] = metadata[i].image;
    };

}, 3600 * 1000);

async function getMetadataFromDatabase(id) {
    let data = {};
    for (var i = 0; i < metadata.length; i++) {
        if (metadata[i].tokenId == id) {
            data = metadata[i];
            break;
        }
    }

    return data;
}

const bagsEndpoints = (app) => {
    // takes a collection of ids and returns them all together

    app.get('/api/purses', async function (req, res, next) {
        try {
            const knightsIds = req.query.items
            let metaList = []
            let requestIds = knightsIds.split(',');

            for (let i = 0; i < requestIds.length; i++) {
                const id = requestIds[i];
                let idInt = parseInt(id);
                let meta = await getMetadataFromDatabase(idInt);
                metaList.push(meta);
            }

            return res.send({
                data: metaList
            });
        } catch (err) {
            return res.status(500).send('Internal Error');
        }
    });

    app.get('/images/bags', async function (req, res, next) {
        try {
            const id = parseInt(req.query["id"]);

            let metadata = metadataImage[id];

            return res.set({
                'Cache-Control': 'max-age=31536000'
            }).sendFile(path.join(__dirname + `../../data/images/bags/${type}/${size}.png`));
        } catch (err) {
            return res.status(500).send('Internal Error');
        }
    });
}


module.exports = bagsEndpoints;