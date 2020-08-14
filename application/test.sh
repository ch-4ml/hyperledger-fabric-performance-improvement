# docker exec -it cli bash

export CORE_PEER_ADDRESS=peer0.org1.dmc.ajou.ac.kr:7051
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.dmc.ajou.ac.kr/peers/peer0.org1.dmc.ajou.ac.kr/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.dmc.ajou.ac.kr/users/Admin@org1.dmc.ajou.ac.kr/msp
export PEER0_ORG1_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.dmc.ajou.ac.kr/peers/peer0.org1.dmc.ajou.ac.kr/tls/ca.crt

#############################################
# Chaincode Invoke - initMarble - marble1
#############################################
export MARBLE=$(echo -n "{\"name\":\"marble1\",\"color\":\"blue\",\"size\":35,\"owner\":\"tom\",\"price\":99}" | base64 | tr -d \\n)
peer chaincode invoke -o orderer.dmc.ajou.ac.kr:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/dmc.ajou.ac.kr/orderers/orderer.dmc.ajou.ac.kr/msp/tlscacerts/tlsca.dmc.ajou.ac.kr-cert.pem -C dmcchannel -n marblesp -c '{"Args":["initMarble"]}'  --transient "{\"marble\":\"$MARBLE\"}"

#############################################
# Chaincode Query as Authorized Peer
#############################################
peer chaincode query -C dmcchannel -n marblesp -c '{"Args":["readMarble","marble1"]}'
peer chaincode query -C dmcchannel -n marblesp -c '{"Args":["readMarblePrivateDetails","marble1"]}'

#############################################
# Chaincode Query as Unauthorized Peer
#############################################
export CORE_PEER_ADDRESS=peer0.org2.dmc.ajou.ac.kr:9051
export CORE_PEER_LOCALMSPID=Org2MSP
export PEER0_ORG2_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.dmc.ajou.ac.kr/peers/peer0.org2.dmc.ajou.ac.kr/tls/ca.crt
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.dmc.ajou.ac.kr/users/Admin@org2.dmc.ajou.ac.kr/msp

peer chaincode query -C dmcchannel -n marblesp -c '{"Args":["readMarble","marble1"]}'
peer chaincode query -C dmcchannel -n marblesp -c '{"Args":["readMarblePrivateDetails","marble1"]}'

#############################################
# Purge Private Data
#############################################
export CORE_PEER_ADDRESS=peer0.org1.dmc.ajou.ac.kr:7051
export CORE_PEER_LOCALMSPID=Org1MSP
export CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.dmc.ajou.ac.kr/peers/peer0.org1.dmc.ajou.ac.kr/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.dmc.ajou.ac.kr/users/Admin@org1.dmc.ajou.ac.kr/msp
export PEER0_ORG1_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.dmc.ajou.ac.kr/peers/peer0.org1.dmc.ajou.ac.kr/tls/ca.crt

peer chaincode query -C dmcchannel -n marblesp -c '{"Args":["readMarblePrivateDetails","marble1"]}'

#############################################
# Chaincode Invoke - initMarble - marble2
#############################################
export MARBLE=$(echo -n "{\"name\":\"marble2\",\"color\":\"blue\",\"size\":35,\"owner\":\"tom\",\"price\":99}" | base64 | tr -d \\n)
peer chaincode invoke -o orderer.dmc.ajou.ac.kr:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/dmc.ajou.ac.kr/orderers/orderer.dmc.ajou.ac.kr/msp/tlscacerts/tlsca.dmc.ajou.ac.kr-cert.pem -C dmcchannel -n marblesp -c '{"Args":["initMarble"]}' --transient "{\"marble\":\"$MARBLE\"}"

peer chaincode query -C dmcchannel -n marblesp -c '{"Args":["readMarblePrivateDetails","marble1"]}'

export MARBLE_OWNER=$(echo -n "{\"name\":\"marble2\",\"owner\":\"joe\"}" | base64 | tr -d \\n)
peer chaincode invoke -o orderer.dmc.ajou.ac.kr:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/dmc.ajou.ac.kr/orderers/orderer.dmc.ajou.ac.kr/msp/tlscacerts/tlsca.dmc.ajou.ac.kr-cert.pem -C dmcchannel -n marblesp -c '{"Args":["transferMarble"]}' --transient "{\"marble_owner\":\"$MARBLE_OWNER\"}"

peer chaincode query -C dmcchannel -n marblesp -c '{"Args":["readMarblePrivateDetails","marble1"]}'

export MARBLE_OWNER=$(echo -n "{\"name\":\"marble2\",\"owner\":\"tom\"}" | base64 | tr -d \\n)
peer chaincode invoke -o orderer.dmc.ajou.ac.kr:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/dmc.ajou.ac.kr/orderers/orderer.dmc.ajou.ac.kr/msp/tlscacerts/tlsca.dmc.ajou.ac.kr-cert.pem -C dmcchannel -n marblesp -c '{"Args":["transferMarble"]}' --transient "{\"marble_owner\":\"$MARBLE_OWNER\"}"

peer chaincode query -C dmcchannel -n marblesp -c '{"Args":["readMarblePrivateDetails","marble1"]}'

export MARBLE_OWNER=$(echo -n "{\"name\":\"marble2\",\"owner\":\"jerry\"}" | base64 | tr -d \\n)
peer chaincode invoke -o orderer.dmc.ajou.ac.kr:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/dmc.ajou.ac.kr/orderers/orderer.dmc.ajou.ac.kr/msp/tlscacerts/tlsca.dmc.ajou.ac.kr-cert.pem -C dmcchannel -n marblesp -c '{"Args":["transferMarble"]}' --transient "{\"marble_owner\":\"$MARBLE_OWNER\"}"

#############################################
# Chaincode Query after 4 block creation 
#############################################
peer chaincode query -C dmcchannel -n marblesp -c '{"Args":["readMarblePrivateDetails","marble1"]}'