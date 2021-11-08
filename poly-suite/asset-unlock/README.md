# Poly Asset Unlock Agent

## Description

This agent checks if an unlock event has the right parameters

## Supported Chains

- Ethereum

## Alerts

- POLY-ASSET-UNLOCK-WRONG-PARAMS
  - Fired when the parameters of the UnlockEvent and the poly storage are different
  - Severity is always set to "critical"
  - Type is always set to "exploit"
  - Metadata fields:
    - "unlockEventParams" - contains {toAssetHash, toAddress, amount} from the UnlockEvent
    - "polyStorageParams" - contains {polyAsset, polyAddress, polyAmount} from the Poly storage which correspond to the UnlockEvent parameters

## Test Data

`npm test`
