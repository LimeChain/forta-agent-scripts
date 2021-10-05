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

You need to change the `countThreshold` value to 2 in the `agent-config.json` for testing.
The agent behaviour can be verified with the following block:

 - 13086312 (2 Mints from 
0x923f3eda48731eb31e9da2ea316554bfad1404f0)
