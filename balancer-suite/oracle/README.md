# Balancer Oracle Disparity Agent

## Description

This agent detects when there is disparity between the instant and the resilient oracle of a pool.

## Supported Chains

- Ethereum

## Alerts

- BALANCER-ORACLE-DISPARITY
  - Fired when the latest and the twap prices differ more than 2% (configurable)
  - Severity is always set to "medium"
  - Type is always set to "suspicious"
  - Metadata fields:
    - "poolName" - the pool's name
    - "instantPrice" - the instant (latest) price
    - "resilientPrice" - the resilient (time-weighted average) price
    - "percentDiff" - the difference between the two prices

## Test Data

`npm test`
