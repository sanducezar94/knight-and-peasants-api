const fs = require('fs');
const fsPromises = fs.promises;

let data = {
    "TrainingCamp0": 0,
    "TrainingCamp1": 0,

    "WeaponsMastery0": 0,
    "WeaponsMastery1": 0,
    "WeaponsMastery2": 0,
    "WeaponsMastery3": 0,

    "ArmorMastery0": 0,
    "ArmorMastery1": 0,
    "ArmorMastery2": 0,
    "ArmorMastery3": 0,

    "ChivalryMastery0": 0,
    "ChivalryMastery1": 0,
    "ChivalryMastery2": 0,
    "ChivalryMastery3": 0,

    "HorseMastery0": 0,
    "HorseMastery1": 0,
    "HorseMastery2": 0,
    "HorseMastery3": 0
};

const collectStats = () => {
    const metadataBytes = await fsPromises.readFile('./data/metadata/knights.json');
    const metadata = JSON.parse(metadataBytes);
    
    try{
        for(let i = 0; i < metadata.length; i++){
            for(let j = 0; j < metadata[i].attributes.length; j++){
                if(metadata[i].attributes[j].trait_type !== 'Income' && metadata[i].attributes[j].trait_type !== "Training Camp" && metadata[i].attributes[j].trait_type !== "Chivalry Mastery" 
                && metadata[i].attributes[j].trait_type !== "Weapons Mastery" && metadata[i].attributes[j].trait_type !== "Horse Mastery" && metadata[i].attributes[j].trait_type !== "Armor Mastery")
                {
                   continue;
                }
                data[metadata[i].attributes[j].trait_type.replace(' ', '') + "" + metadata[i].attributes[j].value] = 0;

            }
        }

        for(let i = 0; i < metadata.length; i++){
            for(let j = 0; j < metadata[i].attributes.length; j++){
                if(metadata[i].attributes[j].trait_type !== 'Income' && metadata[i].attributes[j].trait_type !== "Training Camp" && metadata[i].attributes[j].trait_type !== "Chivalry Mastery" 
                && metadata[i].attributes[j].trait_type !== "Weapons Mastery" && metadata[i].attributes[j].trait_type !== "Horse Mastery" && metadata[i].attributes[j].trait_type !== "Armor Mastery")
                {
                   continue;
                }
                data[metadata[i].attributes[j].trait_type.replace(' ', '') + "" + metadata[i].attributes[j].value] += 1;

            }
        }

        fs.writeFile('./stats/newStats.json', JSON.stringify(data), async (err, data) => {
            if(err) console.log(err);
        });
        
    }
    catch(err){
        console.log(err);
    }
}

module.exports = collectStats;