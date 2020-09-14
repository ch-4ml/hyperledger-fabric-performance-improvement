'use strict';

const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const addPlantsConfigFile = path.resolve(__dirname, 'v1_WorldState_Add10000Plants.json');
const recordTime = path.resolve(__dirname, 'recordTime.json');

const colors=[ 'blue', 'red', 'yellow', 'green', 'white', 'purple' ];
const owners=[ 'tom', 'fred', 'julie', 'james', 'janet', 'henry', 'alice', 'marie', 'sam', 'debra', 'nancy'];
const sizes=[ 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 ];
const docType='plant'

const config = require('./config.json');
const channelid = config.channelid;

const crypto = require('crypto');
const hash = crypto.createHash('sha256');

const mongoose = require('mongoose');
mongoose.connect('mongodb://dmc:dmc1234@localhost:27017/dmc', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
    console.log("Connected to mongod server");
});

const Schema = mongoose.Schema;
const plantSchema = new Schema({
    name: String,
    color: String,
    size: Number,
    owner: String
});
const Plant = mongoose.model('plants', plantSchema);

async function main() {
   
    // 시작 시간
    const startTime = new Date().getTime();
    
    try {

        let nextPlantNumber;
        let numberPlantsToAdd;
        let addPlantsConfig;

        // check to see if there is a config json defined
        if (fs.existsSync(addPlantsConfigFile)) {
            // read file the next plant and number of plants to create
            let addPlantsConfigJSON = fs.readFileSync(addPlantsConfigFile, 'utf8');
            addPlantsConfig = JSON.parse(addPlantsConfigJSON);
            nextPlantNumber = addPlantsConfig.nextPlantNumber;
            numberPlantsToAdd = addPlantsConfig.numberPlantsToAdd;
        } else {
            nextPlantNumber = 1;
            numberPlantsToAdd = 10000;
            // create a default config and save
            addPlantsConfig = new Object;
            addPlantsConfig.nextPlantNumber = nextPlantNumber;
            addPlantsConfig.numberPlantsToAdd = numberPlantsToAdd;
            fs.writeFileSync(addPlantsConfigFile, JSON.stringify(addPlantsConfig, null, 2));
        }

        // Parse the connection profile. This would be the path to the file downloaded
        // from the IBM Blockchain Platform operational console.
        const ccpPath = path.resolve(__dirname, '..', 'first-network', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Configure a wallet. This wallet must already be primed with an identity that
        // the application can use to interact with the peer node.
        const walletPath = path.resolve(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Create a new gateway, and connect to the gateway peer node(s). The identity
        // specified must already exist in the specified wallet.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network channel that the smart contract is deployed to.
        const network = await gateway.getNetwork(channelid);

        // Get the smart contract from the network channel.
        const contract = network.getContract('plantsw');

        for (var counter = nextPlantNumber; counter < nextPlantNumber + numberPlantsToAdd; counter++) {

            var randomColor = Math.floor(Math.random() * (6));
            var randomOwner = Math.floor(Math.random() * (11));
            var randomSize = Math.floor(Math.random() * (10));

            const plant = new Plant();
            plant.name = docType + counter;
            plant.color = colors[randomColor];
            plant.size = sizes[randomSize];
            plant.owner = owners[randomOwner];

            const result = await plant.save();
            hash.update(JSON.stringify(plant));
            const data = hash.copy().digest('hex');

            await contract.submitTransaction('initPlant', docType+counter, data);
            console.log("Adding plant: " + docType + counter + "   hash:"  +  data);
        }

        await gateway.disconnect();

        addPlantsConfig.nextPlantNumber = nextPlantNumber + numberPlantsToAdd;

        fs.writeFileSync(addPlantsConfigFile, JSON.stringify(addPlantsConfig, null, 2));
        const endTime = new Date().getTime();
        fs.writeFileSync(recordTime, JSON.stringify({ execution_time: endTime - startTime }, null, 2));
        console.log(`실행 시간: ${endTime - startTime}`);
    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }

}

main();