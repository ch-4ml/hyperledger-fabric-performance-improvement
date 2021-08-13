"use strict";

const { Wallets, Gateway } = require("fabric-network");
const fs = require("fs");
const path = require("path");

const setPlantsConfigFile = path.resolve(
  __dirname,
  "v4_IPFS_Set100Plants.json"
);
const recordTimeFile = path.resolve(__dirname, "v4_IPFS_RecordTime.json");

const { colors, owners, sizes } = require("./data/plants");
const docType = "plant";

const config = require("./config.json");
const channelid = config.channelid;

const { create } = require("ipfs-http-client");
const ipfs = create();

const unit =
  (process.argv[2] && process.argv[2].toUpperCase() === "K") ||
    (process.argv[2] && process.argv[2].toUpperCase() === "M")
    ? process.argv[2].toUpperCase()
    : "";
const mul = unit === "K" ? 1000 : unit === "M" ? 200000 : 1;

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
    const contract = network.getContract("plantsi");

    for (
      let counter = nextPlantNumber;
      counter < nextPlantNumber + numberPlantsToSet;
      counter++
    ) {
      const randomColor = Math.floor(Math.random() * 6);
      const randomOwner = Math.floor(Math.random() * 11);
      const randomSize = Math.floor(Math.random() * 10);

      const plant = {};
      plant.name = docType + counter;
      plant.color = colors[randomColor].repeat(mul);
      plant.size = sizes[randomSize] * mul;
      plant.owner = owners[randomOwner].repeat(mul);

      console.log(plant);

      const file = await ipfs.add(JSON.stringify(plant));

      const cid = file.path;

      await contract.submitTransaction("initPlant", docType + counter, cid);
      console.log(`Set a plant: ${docType} ${counter} Done`);
    }

    await gateway.disconnect();

    setPlantsConfig.nextPlantNumber = nextPlantNumber + numberPlantsToSet;

    fs.writeFileSync(
      setPlantsConfigFile,
      JSON.stringify(setPlantsConfig, null, 2)
    );
    const endTime = new Date().getTime();
    const recordTime = JSON.parse(fs.readFileSync(recordTimeFile, "utf8"));
    recordTime[`set${unit}`] = endTime - startTime;

    fs.writeFileSync(recordTimeFile, JSON.stringify(recordTime, null, 2));
    console.log(`실행 시간: ${endTime - startTime}`);
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    process.exit(1);
  }
}

main();
