
rm -rf wallet/*

pushd ../network
CC_SRC_LANGUAGE="go"
# deploy chaincode 1
CC_NAME="fixed-asset"
CC_SRC_PATH="../chaincode/fixed-asset/go/"
CC_END_POLICY="OR('Org1MSP.peer','Org2MSP.peer','Org3MSP.peer')"
./network.sh deployCC -ccn ${CC_NAME} -ccv 1 -ccl ${CC_SRC_LANGUAGE} -ccp ${CC_SRC_PATH} -ccep ${CC_END_POLICY}

rm -rf ${CC_NAME}.tar.gz

popd

cat <<EOF

Deploy Chaincode.

EOF

node enrollAdmin
node registerUser