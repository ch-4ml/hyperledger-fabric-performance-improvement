package main

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract example simple Chaincode implementation
type SmartContract struct {
	contractapi.Contract
}

type SimpleAsset struct {
	ObjectType	string `json:"docType"`
	Key   	    string `json:"key"`
	Value				string `json:"value"`
}

type QueryResult struct {
	Key					string `json:"Key"`
	Record			*SimpleAsset
}

// A Buffer for batch processing
var batchMap map[string]string
var batchBuffer []string
var batchCount int

// ===================================================================================
// Main
// ===================================================================================
func main() {
	batchCount = 0
	
	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error create sacc chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting sacc chaincode: %s", err.Error())
	}
}

func (s *SmartContract) batch(ctx contractapi.TransactionContextInterface, key string, value string) (string, error) {
	// const BATCH_SIZE int = 30

	fmt.Println("잘 되고 있지?")
	// key가 batchMap에 있는지 검사하고 있으면 value update, 없으면 해당 key, value 추가
	batchMap[key] = value

	// batchBuffer에 업데이트 할 key들 추가
	if !contains(batchBuffer, key) {
		batchBuffer = append(batchBuffer, key)
	}

	// batchCount에 count
	batchCount += 1
	
	// for test
	for i := 0; i <= len(batchBuffer); i++ {
		fmt.Println(batchBuffer[i])
		fmt.Println(batchMap[batchBuffer[i]])
	}

	// // batchCount가 지정한 횟수에 도달하면
	// if batchCount >= BATCH_SIZE {
	// 	// batchBuffer를 이용해서 loop를 만들고 batchMap으로부터 값을 조회하여 putState
	// 	for i := 0; i <= len(batchBuffer); i++ {

	// 		// ==== Create asset object and marshal to JSON ====
	// 		objectType := "asset"
	// 		asset := &SimpleAsset{objectType, batchBuffer[i], batchMap[batchBuffer[i]]}
	// 		assetJSONString, _ := json.Marshal(asset)
	// 		// if err != nil {
	// 		// 	return shim.Error(err.Error())
	// 		// }

	// 		// === Save asset to state ===
	// 		stub.PutState(batchBuffer[i], assetJSONString)
	// 		// if err != nil {
	// 		// 	return shim.Error(err.Error())
	// 		// }
	// 	}
	// 	msg = "update"
	// }
	return batchBuffer[0], nil
}

// ============================================================
// create - create a new asset, store into chaincode state
// ============================================================
func (s *SmartContract) create(ctx contractapi.TransactionContextInterface, key string, value string) error {

	// ==== Create asset object and marshal to JSON ====
	objectType := "asset"
	asset := SimpleAsset{
		ObjectType: objectType,
		Key: key,
		Value: value,
	}

	assetAsBytes, _ := json.Marshal(asset)
	
	return ctx.GetStub().PutState(key, assetAsBytes)
}

// ===============================================
// read - read a asset from chaincode state
// ===============================================
func (s *SmartContract) read(ctx contractapi.TransactionContextInterface, key string) (*SimpleAsset, error) {
	
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
func (s *SmartContract) update(ctx contractapi.TransactionContextInterface, key string, value string) error {
	asset, err := s.read(ctx, key)

	if err != nil {
		return err
	}

	asset.Value = value
	assetAsBytes, _ := json.Marshal(asset)

	return ctx.GetStub().PutState(key, assetAsBytes)
}

// ==================================================
// delete - remove a asset key/value pair from state
// ==================================================
func (s *SmartContract) delete(ctx contractapi.TransactionContextInterface, key string) error {
	_, err := s.read(ctx, key)

	if err != nil {
		return err
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