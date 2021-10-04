# High Gas Agent

## Description

This agent detects when an address does high volume of interactions (borrow, mint, redeem) with the crETH token in 1 minute.

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- CREAM_HIGH_VOLUME
  - Fired when the number of events in the last minutes for address are > 5
  - Severity is always set to "medium"
  - Type is always set to "suspicious"
  - Metadata fields:
    - "from" - the address which is sending a high volume of transactions
    - "transactions" - list of transaction hashes detected

## Test Data

None
