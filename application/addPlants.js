/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 *
 */

/*
 *
 * addPlants.js will add random sample data to blockchain.
 *
 *    $ node addPlants.js
 *
 * addPlants will add 10 plants by default with a starting plant name of "plant100".
 * Additional plants will be added by incrementing the number at the end of the plant name.
 *
 * The properties for adding plants are stored in addPlants.json.  This file will be created
 * during the first execution of the utility if it does not exist.  The utility can be run
 * multiple times without changing the properties.  The nextPlantNumber will be incremented and
 * stored in the JSON file.
 *
 *    {
 *        "nextPlantNumber": 100,
 *        "numberPlantsToAdd": 10
 *    }
 *
 */

'use strict';

const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const addPlantsConfigFile = path.resolve(__dirname, 'addPlants.json');

const colors=[ 'blue', 'red', 'yellow', 'green', 'white', 'purple' ];
const owners=[ 'tom', 'fred', 'julie', 'james', 'janet', 'henry', 'alice', 'marie', 'sam', 'debra', 'nancy'];
const sizes=[ 10, 20, 30, 40, 50, 60, 70, 80, 90, 100 ];
const docType='plant'

const config = require('./config.json');
const channelid = config.channelid;

async function main() {

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
            nextPlantNumber = 100;
            numberPlantsToAdd = 20;
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
        const contract = network.getContract('plantsp');

        for (var counter = nextPlantNumber; counter < nextPlantNumber + numberPlantsToAdd; counter++) {

            var randomColor = Math.floor(Math.random() * (6));
            var randomOwner = Math.floor(Math.random() * (11));
            var randomSize = Math.floor(Math.random() * (10));

            // Submit the 'initPlant' transaction to the smart contract, and wait for it
            // to be committed to the ledger.

            // Private data sent as transient data: { [key: string]: Buffer }
            const transientData = {
                name: docType + counter,
                color: colors[randomColor],
                owner: owners[randomOwner],
                size: sizes[randomSize],
                price: 99
            };

            const plant = Buffer.from(JSON.stringify(transientData)).toString('base64');

            await contract.createTransaction('initPlant')
                .setTransient({ plant: plant })
                .submit();

            // await contract.submitTransaction('initPlant', docType+counter, colors[randomColor], ''+sizes[randomSize], owners[randomOwner]);
            console.log("Adding plant: " + docType + counter + "   owner:"  + owners[randomOwner] + "   color:" + colors[randomColor] + "   size:" + '' + sizes[randomSize] );

        }

        await gateway.disconnect();

        addPlantsConfig.nextPlantNumber = nextPlantNumber + numberPlantsToAdd;

        fs.writeFileSync(addPlantsConfigFile, JSON.stringify(addPlantsConfig, null, 2));

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        process.exit(1);
    }

}

main();