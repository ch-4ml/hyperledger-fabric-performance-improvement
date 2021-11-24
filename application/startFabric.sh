#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
# Exit on first error
set -e pipefail


# don't rewrite paths for Windows Git Bash users
export MSYS_NO_PATHCONV=1
starttime=$(date +%s)
CC_SRC_LANGUAGE=${1:-"go"}
CC_SRC_LANGUAGE=`echo "$CC_SRC_LANGUAGE" | tr [:upper:] [:lower:]`

CC_RUNTIME_LANGUAGE=golang
CC_SRC_PATH=github.com/chaincode/fixed-asset/go

# clean wallet
rm -rf ./wallet

# clean the keystore
rm -rf ./hfc-key-store

# launch network; create channel and join peer to channel
pushd ../network

./network.sh down
./network.sh up createChannel -ca -s couchdb
popd

./deployCC.sh

if [ -f "setConfig.json" ]; then
  rm ./setConfig.json
fi

cat <<EOF

Total setup execution time : $(($(date +%s) - starttime)) secs ...

EOF
