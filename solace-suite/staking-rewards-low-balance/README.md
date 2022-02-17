# Solace Staking Rewards Low Balance Agent

## Description

This agent detects if the Solace balance of the Staking Rewards contract is low

## Supported Chains

- Ethereum
- Polygon

## Alerts

Describe each of the type of alerts fired by this agent

- SOLACE-STAKING-REWARDS-LOW-BALANCE
  - Fired when the Solace balance of the Staking rewards contract falls below a threshold compared to the reward per year
  - Severity is always set to "high"
  - Type is always set to "info"
  - Metadata:
    - "percentage" - The ratio of Solace balance to reward per year in percentages
