# Balancer Pool Swap Fee Percentage Changed Agent

## Description

This agent detects when the swap fee for Balancer agent has been changed.

## Supported Chains

- Ethereum

## Alerts

- BALANCER-SWAP-FEE-PERCENTAGE-CHANGE
  - Fired when the swap fee changes
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata fields:
    - "address" - the pool's address
    - "fee" - the new fee

## Test Data

The agent behaviour can be verified with the following transactions:

- 0xee64e837215bcc96c653f22a1477b0a99c2579210a61b8d9d9841096fa277456 (SwapFeePercentage changed to 0.01% for 2 pools (0x06df3b2b and 0xfeadd389))
- 0x69f81ba6cc524d2bde001f65d9274fea1b505b1a8dd8dc323c85eb2f2a3c3570 (SwapFeePercentage changed for 15 pools)
