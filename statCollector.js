const test = require('./data/api_metadata_new.json');

let data = {
    "Training Camp-0": 0,
    "Training Camp-1": 0,

    "Weapons Mastery-0": 0,
    "Weapons Mastery-1": 0,
    "Weapons Mastery-2": 0,
    "Weapons Mastery-3": 0,

    "Armor Mastery-0": 0,
    "Armor Mastery-1": 0,
    "Armor Mastery-2": 0,
    "Armor Mastery-3": 0,

    "Chivalry Mastery-0": 0,
    "Chivalry Mastery-1": 0,
    "Chivalry Mastery-2": 0,
    "Chivalry Mastery-3": 0,

    "Horse Mastery-0": 0,
    "Horse Mastery-1": 0,
    "Horse Mastery-2": 0,
    "Horse Mastery-3": 0
};

function doSomething() {
    try{
        for(let i = 0; i < test.length; i++){
            for(let j = 0; j < test[i].attributes.length; j++){
                if(test[i].attributes[j].trait_type !== 'Income' && test[i].attributes[j].trait_type !== "Training Camp" && test[i].attributes[j].trait_type !== "Chivalry Mastery" 
                && test[i].attributes[j].trait_type !== "Weapons Mastery" && test[i].attributes[j].trait_type !== "Horse Mastery" && test[i].attributes[j].trait_type !== "Armor Mastery")
                {
                   continue;
                }
                data[test[i].attributes[j].trait_type + "-" + test[i].attributes[j].value] = 0;

            }
        }

        for(let i = 0; i < test.length; i++){
            for(let j = 0; j < test[i].attributes.length; j++){
                if(test[i].attributes[j].trait_type !== 'Income' && test[i].attributes[j].trait_type !== "Training Camp" && test[i].attributes[j].trait_type !== "Chivalry Mastery" 
                && test[i].attributes[j].trait_type !== "Weapons Mastery" && test[i].attributes[j].trait_type !== "Horse Mastery" && test[i].attributes[j].trait_type !== "Armor Mastery")
                {
                   continue;
                }
                data[test[i].attributes[j].trait_type + "-" + test[i].attributes[j].value] += 1;

            }
        }
        
        console.log(data);
    }
    catch(err){
        console.log(err);
    }
}

doSomething();