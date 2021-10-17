# Balancer LBP Swap Enabled Agent

## Description

This agent detects when the swapping for a Balancer Liquidity Bootstrap Pool has been changed.

## Supported Chains

- Ethereum

## Alerts

- BALANCER-SWAP-ENABLED-CHANGED
  - Fired when swapping for a LBP pool is being enabled/disabled
  - Severity is always set to "medium"
  - Type is always set to "suspicious"
  - Metadata fields:
    - "address" - the pool's address
    - "swapEnabled" - 'true' if swap is enabled; 'false' if swap is disabled

## Test Data

The agent behaviour can be verified with the following transaction (Swaps for 0x4956d05002bbe857a6b20eb17cbd66da40a5e971 are disabled):

- 0xbf678768aa2c886aa7ddfddf47b846dbe0ddd529dd331c80dbb0e955902c5fa9
