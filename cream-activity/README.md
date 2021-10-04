# High Gas Agent

## Description

This agent detects when an address does high volume of interactions (borrow, mint, redeem) with the crETH token in 1 minute.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- cream-v1-eth-activity
  - Fired when an address does an action (Borrow, Mint or Redeem) 5 times in a minute
  - Severity is always set to "medium"
  - Type is always set to "suspicious"
  - Metadata fields:
    - "from" - the address which is sending a high volume of transactions
    - "transactions" - list of transaction hashes detected

## Test Data

None
