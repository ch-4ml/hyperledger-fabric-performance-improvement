"use strict";

const { Wallets, Gateway } = require("fabric-network");
const fs = require("fs");
const path = require("path");

const setPlantsConfigFile = path.resolve(
  __dirname,
  "v3_WebDB_Set100Plants.json"
);
const recordTimeFile = path.resolve(__dirname, "v3_WebDB_RecordTime.json");

const { owners } = require("./data/plants");
const docType = "plant";

const config = require("./config.json");
const channelid = config.channelid;

const crypto = require("crypto");
const hash = crypto.createHash("sha256");

const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/dmc", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error);
db.once("open", function () {
  console.log("Connected to mongod server");
});

const Schema = mongoose.Schema;
const plantSchema = new Schema({
  name: { type: String, unique: true },
  color: String,
  size: Number,
  owner: String,
});
const Plant = mongoose.model("plants", plantSchema);

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
    const contract = network.getContract("plantsw");

    for (
      let counter = nextPlantNumber - 100;
      counter < nextPlantNumber;
      counter++
    ) {
      const randomOwner = Math.floor(Math.random() * 11);

      let result = await Plant.findOne({ name: docType + counter });
      const { name, color, size, owner } = result;
      const plant = { name, color, size, owner };
      console.log(plant);

      hash.update(JSON.stringify(plant));
      let data = hash.copy().digest("hex");
      console.log(data);

      const p = await contract.evaluateTransaction(
        "readPlant",
        docType + counter
      );
      await Plant.updateOne(
        { name: docType + counter },
        { $set: { owner: owners[randomOwner] } }
      );
      const plantData = {
        name: plant.name,
        color: plant.color,
        size: plant.size,
        owner: owners[randomOwner].repeat(mul),
      };

      hash.update(JSON.stringify(plantData));
      data = hash.copy().digest("hex");

      await contract.submitTransaction("updatePlant", docType + counter, data);
      console.log(`Update a plant: ${docType} ${counter} Done`);
    }

    await gateway.disconnect();
    db.close();

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
