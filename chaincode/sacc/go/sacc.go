package main

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract example simple Chaincode implementation
type SmartContract struct {
	contractapi.Contract
}

type SimpleAsset struct {
	ObjectType string `json:"docType"`
	Key        string `json:"key"`
	Value      int    `json:"value"`
}

// A Buffer for batch processin
// var peerId int

// const BATCH_TIME time.Duration = 150
// var batchTimer *time.Timer

// func (s *SmartContract) SetID(ctx contractapi.TransactionContextInterface, id int) (bool, error) {
// 	if peerId == 0 {
// 		peerId = id
// 		return true, nil
// 	} else {
// 		return false, nil
// 	}
// }

func (s *SmartContract) Batch(ctx contractapi.TransactionContextInterface, batch string) (string, error) {
	batchArray := []SimpleAsset{}
	err := json.Unmarshal([]byte(batch), &batchArray)
	if err != nil {
		return "", err
	}

	for index, assetToUpdate := range batchArray {
		fmt.Println("Entered loop: ", index)
		asset, _ := s.Read(ctx, assetToUpdate.Key)
		asset.Value += assetToUpdate.Value
		v := strconv.Itoa(asset.Value)
		fmt.Println(v)
		bytes, _ := json.Marshal(asset)
		err = ctx.GetStub().PutState(asset.Key, bytes)
		if err != nil {
			return "", err
		}
		fmt.Println("Leave loop: ", index)
	}

	return "Success", nil
}

// ============================================================
// create - create a new asset, store into chaincode state
// ============================================================
func (s *SmartContract) Create(ctx contractapi.TransactionContextInterface, key string) error {
	// ==== Create asset object and marshal to JSON ====
	objectType := "asset"
	asset := SimpleAsset{
		ObjectType: objectType,
		Key:        key,
		Value:      0,
	}

	assetAsBytes, _ := json.Marshal(asset)

	return ctx.GetStub().PutState(key, assetAsBytes)
}

// ===============================================
// read - read a asset from chaincode state
// ===============================================
func (s *SmartContract) Read(ctx contractapi.TransactionContextInterface, key string) (*SimpleAsset, error) {
	assetAsBytes, err := ctx.GetStub().GetState(key)
	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if assetAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", key)
	}

	asset := new(SimpleAsset)
	_ = json.Unmarshal(assetAsBytes, asset)

	return asset, nil
}

// ===============================================
// update - update a asset from chaincode state
// ===============================================
func (s *SmartContract) Update(ctx contractapi.TransactionContextInterface, key string) error {
	asset, _ := s.Read(ctx, key)
	asset.Value += 1
	assetAsBytes, _ := json.Marshal(asset)

	return ctx.GetStub().PutState(key, assetAsBytes)
}

// ==================================================
// delete - remove a asset key/value pair from state
// ==================================================
func (s *SmartContract) Delete(ctx contractapi.TransactionContextInterface, key string) error {
	asset, err := s.Read(ctx, key)
	if err != nil {
		return err
	}

	// TODO: 정상 동작하는지 확인
	if asset == nil {
		return nil
	}

	return ctx.GetStub().DelState(key)
}

func contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

// ===================================================================================
// Main
// ===================================================================================
func main() {
	// peerId = 0
	// batchTimer = time.NewTimer(9999)

	chaincode, err := contractapi.NewChaincode(new(SmartContract))
	if err != nil {
		fmt.Printf("Error create sacc chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting sacc chaincode: %s", err.Error())
	}
}
