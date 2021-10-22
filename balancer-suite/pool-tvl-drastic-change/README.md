# Balancer Pool TVL Drastic Change

## Description

This agent detects when the Total Value Locked (TVL) of a token in a pool increases or decreases significantly.

## Supported Chains

- Ethereum

## Alerts

- BALANCER-TVL-DRASTIC-CHANGE
  - Fired when TVL of token in a pool changes drastically
  - Severity is always set to "medium"
  - Type is always set to "suspicious"
  - Metadata fields:
    - "poolId" - the pool's ID
    - "token" - the token's address
    - "percentageDiff" - the percentage difference
    - "liquidityProvider" - the address who added or removed the tokens

## Test Data

`npm test`
