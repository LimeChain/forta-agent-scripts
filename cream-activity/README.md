# High Gas Agent

## Description

This agent detects when an address does high volume of interactions (borrow, mint, redeem) with the crETH token in 1 hour.

## Deployment

- Set unique name and version in the `package.json`
- Set `ipfsGatewayUrl`, `ipfsGatewayAuth` and `agentRegistryJsonRpcUrl` in the `forta.config.json`
- ```npm run publish```
- For more information check the [Forta docs](https://docs.forta.network/en/latest/deploying/)

## Supported Chains

- Ethereum

## Alerts

Describe each of the type of alerts fired by this agent

- cream-v1-eth-activity
  - Fired when an address does an action (Borrow, Mint or Redeem) 5 times in an hour
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
