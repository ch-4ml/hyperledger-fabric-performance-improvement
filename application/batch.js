"use strict";

const { Wallets, Gateway } = require("fabric-network");
const fs = require("fs");
const path = require("path");

const setAssetsConfigFile = path.resolve(__dirname, "setConfig.json");
const recordTimeFile = path.resolve(__dirname, "record.json");

const BATCH_SIZE = 25;

const docType = "asset";

const config = require("./config.json");
const channelid = config.channelid;

async function main() {
  const startTime = new Date().getTime();

  try {
    let nextAssetNumber;
    let numberAssetsToSet;
    let setAssetsConfig;

    if (fs.existsSync(setAssetsConfigFile)) {
      let setAssetsConfigJSON = fs.readFileSync(setAssetsConfigFile, "utf8");
      setAssetsConfig = JSON.parse(setAssetsConfigJSON);
      nextAssetNumber = setAssetsConfig.nextAssetNumber;
      numberAssetsToSet = setAssetsConfig.numberAssetsToSet;
    } else {
      nextAssetNumber = 1;
      numberAssetsToSet = 100;
      setAssetsConfig = new Object();
      setAssetsConfig.nextAssetNumber = nextAssetNumber;
      setAssetsConfig.numberAssetsToSet = numberAssetsToSet;
      fs.writeFileSync(setAssetsConfigFile, JSON.stringify(setAssetsConfig, null, 2));
    }

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

    const walletPath = path.resolve(__dirname, "wallet");
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: "appUser",
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork(channelid);
    const contract = network.getContract("sacc");

    const reps = process.argv[3] ? numberAssetsToSet * (process.argv[3] - 1) : 0;

    let flushTimer;
    let batch = [];

    for (let counter = nextAssetNumber - numberAssetsToSet; counter < nextAssetNumber + reps; counter++) {
      const assetNumber =
        process.argv[2] && process.argv[2].toUpperCase() === "R"
          ? Math.floor(
              Math.random() * (nextAssetNumber - (nextAssetNumber - numberAssetsToSet)) +
                (nextAssetNumber - numberAssetsToSet)
            )
          : counter;
      const index = batch.findIndex((item) => item.key === `${docType}${assetNumber}`);

      if (index > -1) {
        batch[index].value += 1;
      } else {
        batch.push({ key: `${docType}${assetNumber}`, value: 1 });
      }

      console.log(batch);

      const flush = async () => {
        const result = await contract.submitTransaction("batch", JSON.stringify(batch));
        batch = [];
      };

      console.log(batch.length);

      if (batch.length >= BATCH_SIZE) await flush();

      if (flushTimer) clearTimeout(flushTimer);
      flushTimer = setTimeout(flush, 500);

      console.log(`Update a asset: ${docType} ${assetNumber} Done`);
    }

    const endTime = new Date().getTime();
    const recordTime = JSON.parse(fs.readFileSync(recordTimeFile, "utf8"));
    recordTime[`batch${process.argv[2]}${process.argv[3]}`] = endTime - startTime;

    fs.writeFileSync(recordTimeFile, JSON.stringify(recordTime, null, 2));
    console.log(`?????? ??????: ${endTime - startTime}`);
    setTimeout(async () => {
      await gateway.disconnect();
    }, 2000);
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    process.exit(1);
  }
}

main();
