# Poly Asset Unlock Agent

## Description

This agent compares the cross chain events emitted from the poly chain against the source chain contract storage value.

## Supported Chains

- Ethereum

## Alerts

- POLY-CROSS-CHAIN-EVENT-WRONG-PARAMS
  - Fired when the hashes from the source chain and the Poly storage are different
  - Severity is always set to "critical"
  - Type is always set to "exploit"
  - Metadata fields:
    - "txHash" - the transaction hash
    - "storageHash" - the hash in the Poly storage
    - "srcChainHash" - the hash in the source chain

## Test Data

`npm test`
