# High Number of Interactions by Account Agent

## Description

Detects if an address interacts with Iron Bank markets a lot in a time interval

## Supported Chains

- Ethereum

## Alerts

- IRON-BANK-HIGH-NUMBER-OF-INTERACTIONS-BY-ADDRESS
  - Fired when accounts interacts with Iron Bank more than `INTERACTION_THRESHOLD` times in a time interval
  - Severity is always set to "medium"
  - Type is always set to "info"
  - Metadata field:
    - "account" - the address that interacted with the markets
    - "interactions" - an array of interaction. Each contains the hash of the transaction and the name of the action
