# Poly Total Locked Asset Amount Agent

## Description

This agent compares the locked asset amount in the source chain to the total unlocked asset amount in all destination chains

## Supported Chains

- Ethereum

## Alerts

- POLY-LOCKED-AMOUNT-LESS-THAN-UNLOCKED
  - Fired if the locked amount is less than the unlocked amount
  - Severity is always set to "critical"
  - Type is always set to "exploit"
  - Metadata fields:
    - "token" - the token's ticker
    - "lockedAmount" - the locked amount in the source chain
    - "unlockedAmount" - the total unlocked amount in all destination chains

## Test Data

`npm test`
