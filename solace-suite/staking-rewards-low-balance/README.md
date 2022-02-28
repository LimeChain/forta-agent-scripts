# Solace Staking Rewards Low Balance Agent

## Description

Detects if the Solace balance of the Staking Rewards contract is low

## Supported Chains

- Ethereum
- Polygon

## Alerts

- SOLACE-STAKING-REWARDS-LOW-BALANCE
  - Fired when the Solace balance of the Staking rewards contract falls below a threshold compared to the reward per year
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata:
    - "percentage" - The ratio of Solace balance to reward per year in percentages
