/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets, Gateway, X509WalletMixin } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const { AffiliationService } = require('fabric-ca-client');

async function main() {
  try {
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', 'first-network', 'connection-org3.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new CA client for interacting with the CA.
    const caURL = ccp.certificateAuthorities['ca.org3.dmc.ajou.ac.kr'].url;
    const ca = new FabricCAServices(caURL);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the admin user.
    const adminIdentity = await wallet.get('admin3');
    if (!adminIdentity) {
        console.log('An identity for the admin user "admin3" does not exist in the wallet');
        console.log('Run the enrollAdmin.js application before retrying');
        return;
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin3');
    
    const affiliationService = ca.newAffiliationService();

    const result = await affiliationService.create({
      req: {
        name: "org3.department1"
      },
      registrar: {
        req: {
          name: "1"
        }
      }
    });

    console.log(result);
    
  } catch (error) {
      console.error(`Failed to add affiliation: ${error}`);
      process.exit(1);
  }
}

main();