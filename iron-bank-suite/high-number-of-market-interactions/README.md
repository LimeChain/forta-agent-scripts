# High Number of Market Interactions Agent

## Description

Detects if there are a lot of interactions with an Iron Bank market in a short time

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-HIGH-NUMBER-OF-MARKET-INTERACTIONS
  - Fired when there are more than `INTERACTION_THRESHOLD` interactions with an Iron Bank market in a time interval
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "market" - the Iron Bank market
    - "interactions" - an array of interaction. Each contains the hash of the transaction and the name of the action
