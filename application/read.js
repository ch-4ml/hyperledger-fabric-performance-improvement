"use strict";

const { Wallets, Gateway } = require("fabric-network");
const fs = require("fs");
const path = require("path");

const setAssetsConfigFile = path.resolve(__dirname, "setConfig.json");
const recordTimeFile = path.resolve(__dirname, "record.json");

const docType = "asset";

const config = require("./config.json");
const channelid = config.channelid;

async function main() {
  // 시작 시간
  const startTime = new Date().getTime();

  try {
    let nextAssetNumber;
    let numberAssetsToSet;
    let setAssetsConfig;

    // check to see if there is a config json defined
    if (fs.existsSync(setAssetsConfigFile)) {
      // read file the next asset and number of assets to create
      let setAssetsConfigJSON = fs.readFileSync(setAssetsConfigFile, "utf8");
      setAssetsConfig = JSON.parse(setAssetsConfigJSON);
      nextAssetNumber = setAssetsConfig.nextAssetNumber;
      numberAssetsToSet = setAssetsConfig.numberAssetsToSet;
    } else {
      nextAssetNumber = 1;
      numberAssetsToSet = 100;
      // create a default config and save
      setAssetsConfig = new Object();
      setAssetsConfig.nextAssetNumber = nextAssetNumber;
      setAssetsConfig.numberAssetsToSet = numberAssetsToSet;
      fs.writeFileSync(
        setAssetsConfigFile,
        JSON.stringify(setAssetsConfig, null, 2)
      );
    }

    // Parse the connection profile. This would be the path to the file downloaded
    // from the IBM Blockchain Platform operational console.
    const ccpPath = path.resolve(
      __dirname,
      "..",
      "network",
      "organizations",
      "peerOrganizations",
      "org1.example.com",
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
    const contract = network.getContract("sacc");

    let total = 0;

    for (
      let counter = nextAssetNumber - numberAssetsToSet;
      counter < nextAssetNumber;
      counter++
    ) {
      // Submit the 'initAsset' transaction to the smart contract, and wait for it
      // to be committed to the ledger.

      const result = await contract.evaluateTransaction(
        "read",
        docType + counter.toString()
      );
      console.log(`Read a asset: ${docType} ${counter} Done: ${result}`);
      const json = JSON.parse(result);
      total += json.value;
    }

    console.log(`total value: ${total}`);

    await gateway.disconnect();

    const endTime = new Date().getTime();
    const recordTime = JSON.parse(fs.readFileSync(recordTimeFile, "utf8"));
    recordTime[`get`] = endTime - startTime;

    fs.writeFileSync(recordTimeFile, JSON.stringify(recordTime, null, 2));
    console.log(`실행 시간: ${endTime - startTime}`);
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    process.exit(1);
  }
}

main();
