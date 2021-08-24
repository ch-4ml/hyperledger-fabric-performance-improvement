package main

import (
	"encoding/json"
	"fmt"
	"strings"
	// "time"
	"strconv"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract example simple Chaincode implementation
type SmartContract struct {
	contractapi.Contract
}

type SimpleAsset struct {
	ObjectType	string `json:"docType"`
	Key   	    string `json:"key"`
	Value				int		 `json:"value"`
}

// A Buffer for batch processing
var batchMap map[string]int
var batchKeyBuffer []string
var batchCount int
const BATCH_SIZE int = 25
// const BATCH_TIME time.Duration = 150
// var batchTimer *time.Timer

func (s *SmartContract) Batch(ctx contractapi.TransactionContextInterface, key string) (string, error) {
	// key가 batchMap에 있는지 검사하고 있으면 value update, 없으면 해당 key, value 추가
	// batchTimer.Stop()
	
	_, isKeyExists := batchMap[key]
	if !isKeyExists {
		batchMap[key] = 1
	} else {
		batchMap[key] += 1
	}

	// batchKeyBuffer에 업데이트 할 key들 추가
	if !contains(batchKeyBuffer, key) {
		batchKeyBuffer = append(batchKeyBuffer, key)
	}

	// batchCount에 count
	batchCount += 1

	// batchCount가 지정한 횟수에 도달하면
	if batchCount >= BATCH_SIZE {
		s.Flush(ctx)
		// batchTimer.Stop()
	}

	// batchTimer.Reset(time.Millisecond * BATCH_TIME)
	// go func() {
	// 	<-batchTimer.C
	// 	s.Flush(ctx)
	// }()

	return strings.Join(batchKeyBuffer, " "), nil
}

func (s *SmartContract) Flush(ctx contractapi.TransactionContextInterface) (string, error) {
	// batchKeyBuffer를 이용해서 loop를 만들고 batchMap으로부터 값을 조회하여 putState
	batchKeyBufferLength := len(batchKeyBuffer)
	for i := 0; i < len(batchKeyBuffer); i++ {
		asset, _ := s.Read(ctx, batchKeyBuffer[i])
		asset.Value += batchMap[batchKeyBuffer[i]]
		assetAsBytes, _ := json.Marshal(asset)
		// === Save asset to state ===
		ctx.GetStub().PutState(batchKeyBuffer[i], assetAsBytes)

		batchMap[batchKeyBuffer[i]] = 0
	}
	batchCount = 0
	batchKeyBuffer = nil
	flushedKeyLength := strconv.Itoa(batchKeyBufferLength)
	return flushedKeyLength, nil
}

// ============================================================
// create - create a new asset, store into chaincode state
// ============================================================
func (s *SmartContract) Create(ctx contractapi.TransactionContextInterface, key string) error {

	// ==== Create asset object and marshal to JSON ====
	objectType := "asset"
	asset := SimpleAsset{
		ObjectType: objectType,
		Key: key,
		Value: 0,
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
	_, err := s.Read(ctx, key)

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

// ===================================================================================
// Main
// ===================================================================================
func main() {
	batchCount = 0
	batchMap = make(map[string]int)
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