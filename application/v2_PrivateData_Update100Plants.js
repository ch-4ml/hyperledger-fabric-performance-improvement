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
 *        "numberPlantsToSet": 10
 *    }
 *
 */

"use strict";

const { Wallets, Gateway } = require("fabric-network");
const fs = require("fs");
const path = require("path");

const setPlantsConfigFile = path.resolve(
  __dirname,
  "v2_PrivateData_Set100Plants.json"
);
const recordTimeFile = path.resolve(
  __dirname,
  "v2_PrivateData_RecordTime.json"
);

const { owners } = require("./data/plants");
const docType = "plant";

const config = require("./config.json");
const channelid = config.channelid;

const unit =
  (process.argv[2] && process.argv[2].toUpperCase() === "K") ||
  (process.argv[2] && process.argv[2].toUpperCase() === "M")
    ? process.argv[2].toUpperCase()
    : "";

const mul = unit === "K" ? 1000 : unit === "M" ? 1000000 : 1;

async function main() {
  // 시작 시간
  const startTime = new Date().getTime();

  try {
    let nextPlantNumber;
    let numberPlantsToSet;
    let setPlantsConfig;

    // check to see if there is a config json defined
    if (fs.existsSync(setPlantsConfigFile)) {
      // read file the next plant and number of plants to create
      let setPlantsConfigJSON = fs.readFileSync(setPlantsConfigFile, "utf8");
      setPlantsConfig = JSON.parse(setPlantsConfigJSON);
      nextPlantNumber = setPlantsConfig.nextPlantNumber;
      numberPlantsToSet = setPlantsConfig.numberPlantsToSet;
    } else {
      nextPlantNumber = 1;
      numberPlantsToSet = 100;
      // create a default config and save
      setPlantsConfig = new Object();
      setPlantsConfig.nextPlantNumber = nextPlantNumber;
      setPlantsConfig.numberPlantsToSet = numberPlantsToSet;
      fs.writeFileSync(
        setPlantsConfigFile,
        JSON.stringify(setPlantsConfig, null, 2)
      );
    }

    // Parse the connection profile. This would be the path to the file downloaded
    // from the IBM Blockchain Platform operational console.
    const ccpPath = path.resolve(
      __dirname,
      "..",
      "first-network",
      "connection-org1.json"
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));

    // Configure a wallet. This wallet must already be primed with an identity that
    // the application can use to interact with the peer node.
    const walletPath = path.resolve(__dirname, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Create a new gateway, and connect to the gateway peer node(s). The identity
    // specified must already exist in the specified wallet.
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    // Get the network channel that the smart contract is deployed to.
    const network = await gateway.getNetwork(channelid);

    // Get the smart contract from the network channel.
    const contract = network.getContract("plantsp");

    for (
      let counter = nextPlantNumber - 100;
      counter < nextPlantNumber;
      counter++
    ) {
      const randomOwner = Math.floor(Math.random() * 11);

      // Private data sent as transient data: { [key: string]: Buffer }
      const transientData = {
        name: docType + counter,
        owner: owners[randomOwner].repeat(mul),
      };

      const plant = Buffer.from(JSON.stringify(transientData)).toString(
        "base64"
      );

      await contract
        .createTransaction("transferPlant")
        .setTransient({ plant_owner: plant })
        .submit();

      console.log(`Update a plant: ${docType} ${counter} Done`);
    }

    await gateway.disconnect();

    const endTime = new Date().getTime();
    const recordTime = JSON.parse(fs.readFileSync(recordTimeFile, "utf8"));
    recordTime[`update${unit}`] = endTime - startTime;

    fs.writeFileSync(recordTimeFile, JSON.stringify(recordTime, null, 2));
    console.log(`실행 시간: ${endTime - startTime}`);
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    process.exit(1);
  }
}

main();
