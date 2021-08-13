[Notion Link](https://www.notion.so/a737dea891914680a84c09886ce6a3f0)

## 아래 3가지 구조를 구축하고 Performance 비교 후 개선점 도출

- [ ] Ethereum - External DB
- [ ] Hyperledger Fabric - Side DB(Couch DB)
  - Organization 3개
  - Peer 3 / 1 / 1개
  - Couch DB 개수 1개 ~ 5개 모두 구성
- [ ] Hyperledger Fabric - External DB

## 타 논문 찾고 비교

Keywords: hyperledger performance evaluation, hyperledger side DB

## 실험 방법

측정을 원하는 저장방식에 맞는 쉘 스크립트를 구동 (/application/\*.sh)

`.../application$ ./startFabric.sh`

네트워크 구동, 체인코드 설치 및 배포가 완료되면 그에 맞는 측정 파일을 실행

`node v1_WorldState_Set100Plants.js [arg]`

인자로는 K(k), M(m)을 받으며 각각 KiloBytes, MegaBytes를 의미함

입력받는 인자에 따라서 데이터 사이즈를 변경해서 측정하며,<br>
인자를 입력하지 않는 경우에는 기본 데이터로 측정 (Bytes)

## 진행 상황

- **20. 08. 05**
- **20. 08. 08 - 네트워크 구조 수정**
