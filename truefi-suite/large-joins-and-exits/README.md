# TrueFi Large Joins and Exits

## Description

Detects if the transaction contains a join or exit with high amount

## Supported Chains

- Ethereum

## Alerts

- TRUEFI-LARGE-JOIN
  - Fired when someone joins a TrueFi pool with high amount
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - "account" - the staker's address
    - "pool" - the TrueFi pool's name
    - "amount"

- TRUEFI-LARGE-EXIT
  - Fired when someone exits a TrueFi pool with high amount
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata:
    - "account" - the staker's address
    - "pool" - the TrueFi pool's name
    - "amount"

## Test Data

The agent behaviour can be verified with the following transactions:

- 0xb5ea89273ef08ea93f31b168aba426e2350fbdbea943031367a4ae53d19dfdf7 (Join in tfTUSD with amount $155504)
- 0x93836d546ebc32837ccb806e23348959b2672a8fe8be3a2218b4a3b5fa077a78 (Exit from tfUSDC with amount $499544)
